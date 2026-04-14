const express = require('express');
const router = express.Router();
const DiseaseMetadata = require('../models/DiseaseMetadata');
const DiseaseInsight = require('../models/DiseaseInsight');
const UserProfile = require('../models/UserProfile');
const { calculateDetailedInsights } = require('../utils/riskScorer');
const aiService = require('../services/aiService');

// Auto-seed helper: creates DiseaseMetadata if missing
function getAutoMetadata(diseaseId) {
  const label = diseaseId.replace(/_/g, ' ');
  const map = {
    diabetes: 'Endocrinologist',
    pre_diabetes: 'Endocrinologist',
    thyroid: 'Endocrinologist',
    pcos: 'Gynecologist',
    obesity: 'Bariatric Specialist',
    heart_disease: 'Cardiologist',
    hypertension: 'Cardiologist',
    asthma: 'Pulmonologist',
    copd: 'Pulmonologist',
    respiratory: 'Pulmonologist',
    depression: 'Psychiatrist',
    anxiety: 'Psychiatrist',
    fatty_liver: 'Hepatologist',
    anemia: 'General Physician',
    vitamin_d: 'General Physician',
    vitamin_b12: 'General Physician',
    ckd: 'Nephrologist',
    stroke: 'Neurologist',
    osteoporosis: 'Rheumatologist',
    osteoarthritis: 'Orthopedist',
    surgical: 'General Surgeon'
  };
  return {
    diseaseId,
    displayName: label.charAt(0).toUpperCase() + label.slice(1),
    specialty: map[diseaseId] || 'General Physician',
    sources: ['Auto-generated'],
    alternativeSpecialists: []
  };
}

// @route   GET /api/diseases/:diseaseId/details
// @desc    Get complete disease info for a specific user
router.get('/:diseaseId/details', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId } = req.query; // Expecting clerkId in query for now

    console.log(`[DiseaseDetails] Fetching for diseaseId=${diseaseId}, clerkId=${clerkId}`);

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    // 1. Fetch Metadata and Profile
    const [metadata, profile] = await Promise.all([
      DiseaseMetadata.findOne({ diseaseId }),
      UserProfile.findOne({ clerkId })
    ]);

    console.log(`[DiseaseDetails] metadata found: ${!!metadata}, profile found: ${!!profile}`);

    if (!metadata) {
      console.log(`[DiseaseDetails] Metadata missing for ${diseaseId}, auto-creating...`);
      const autoMeta = getAutoMetadata(diseaseId);
      metadata = await DiseaseMetadata.create(autoMeta);
      console.log(`[DiseaseDetails] Auto-created metadata for ${diseaseId}`);
    }

    // 2. Fetch or Calculate Insight
    let currentInsight = await DiseaseInsight.findOne({ clerkId, diseaseId });
    if (!currentInsight) {
      if (profile) {
        console.log(`[DiseaseDetails] No insight found, calculating for ${diseaseId}`);
        const calculated = calculateDetailedInsights(profile, diseaseId);
        currentInsight = new DiseaseInsight({
          clerkId,
          ...calculated
        });
        await currentInsight.save();
        console.log(`[DiseaseDetails] Insight calculated and saved. riskScore=${calculated.riskScore}`);
      } else {
        // No profile yet — create empty insight
        console.log(`[DiseaseDetails] No profile for ${clerkId}, creating empty insight for ${diseaseId}`);
        currentInsight = new DiseaseInsight({
          clerkId,
          diseaseId,
          riskScore: -1,
          riskCategory: 'N/A',
          dataCompleteness: 0,
          factorBreakdown: [],
          protectiveFactors: [],
          missingDataFactors: [],
          consultationTriggers: []
        });
        await currentInsight.save();
      }
    }

    // 3. Generate Personalized Mitigations (Step 1.5 & 1.6)
    // We generate these fresh to ensure allergies/medications are processed
    try {
      // Build comprehensive profile with all user data
      const comprehensiveProfile = {
        ...(profile || {}),
        // Include onboarding data
        age: profile?.age || { value: 30 },
        gender: profile?.gender || { value: 'Other' },
        bmi: profile?.bmi || { value: 22 },
        // Include allergies and medications explicitly
        allergies: profile?.allergies || [],
        activeMedications: profile?.activeMedications || [],
        // Include lifestyle factors
        activityLevel: profile?.activityLevel || { value: 'Sedentary' },
        dietType: profile?.dietType || { value: 'Non-Veg' },
        isSmoker: profile?.isSmoker || { value: false },
        // Include any missing vital signs
        blood_pressure: profile?.blood_pressure || {},
        blood_glucose: profile?.blood_glucose || {},
        heart_rate: profile?.heart_rate || {}
      };

      const mitigationSteps = await aiService.generateMitigationSteps(
        comprehensiveProfile, 
        diseaseId, 
        currentInsight?.riskScore || 0
      );
      console.log(`[DiseaseDetails] Generated ${mitigationSteps.length} mitigation steps`);
      
      res.json({
        status: 'success',
        data: {
          diseaseMetadata: metadata,
          riskScore: currentInsight?.riskScore,
          riskCategory: currentInsight?.riskCategory,
          dataCompleteness: currentInsight?.dataCompleteness,
          factorBreakdown: currentInsight?.factorBreakdown,
          protectiveFactors: currentInsight?.protectiveFactors,
          missingDataFactors: currentInsight?.missingDataFactors,
          mitigationSteps: mitigationSteps,
          consultationTriggers: currentInsight?.consultationTriggers,
          specialistInformation: {
            primary: metadata.specialty,
            alternatives: metadata.alternativeSpecialists
          },
          sourceAttributions: metadata.sources,
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          userProfile: {
            allergies: profile?.allergies || [],
            activeMedications: profile?.activeMedications || [],
            age: profile?.age?.value,
            gender: profile?.gender?.value,
            bmi: profile?.bmi?.value,
            activityLevel: profile?.activityLevel?.value,
            dietType: profile?.dietType?.value,
            isSmoker: profile?.isSmoker?.value,
            onboardingCompleted: profile?.onboardingCompleted
          },
          reviewedAt: currentInsight?.reviewedAt
        }
      });
    } catch (mitErr) {
      console.error(`[DiseaseDetails] Mitigation generation failed:`, mitErr.message);
      // Return response without mitigations rather than failing entirely
      res.json({
        status: 'success',
        data: {
          diseaseMetadata: metadata,
          riskScore: currentInsight?.riskScore,
          riskCategory: currentInsight?.riskCategory,
          dataCompleteness: currentInsight?.dataCompleteness,
          factorBreakdown: currentInsight?.factorBreakdown,
          protectiveFactors: currentInsight?.protectiveFactors,
          missingDataFactors: currentInsight?.missingDataFactors,
          mitigationSteps: [],
          consultationTriggers: currentInsight?.consultationTriggers,
          specialistInformation: {
            primary: metadata.specialty,
            alternatives: metadata.alternativeSpecialists
          },
          sourceAttributions: metadata.sources,
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          userProfile: {
            allergies: profile?.allergies || [],
            activeMedications: profile?.activeMedications || [],
            age: profile?.age?.value,
            gender: profile?.gender?.value,
            bmi: profile?.bmi?.value,
            activityLevel: profile?.activityLevel?.value,
            dietType: profile?.dietType?.value,
            isSmoker: profile?.isSmoker?.value,
            onboardingCompleted: profile?.onboardingCompleted
          },
          reviewedAt: currentInsight?.reviewedAt
        }
      });
    }
  } catch (error) {
    console.error('[DiseaseDetails] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/diseases/:diseaseId/add-data
// @desc    Accept new data and return recalculated risk
router.post('/:diseaseId/add-data', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId, field, value, unit } = req.body;

    if (!clerkId || !field || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'clerkId, field, and value are required' });
    }

    // 1. Update User Profile
    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    // Update the specific field (following the FieldSchema pattern)
    profile[field] = {
      value,
      lastUpdated: new Date(),
      updateType: 'real_change',
      unit: unit || profile[field]?.unit
    };
    
    // Save profile changes
    await profile.save();

    // 2. Recalculate Insight
    const newInsightData = calculateDetailedInsights(profile, diseaseId);
    
    // 3. Update or Create Insight record
    const updatedInsight = await DiseaseInsight.findOneAndUpdate(
      { clerkId, diseaseId },
      { $set: newInsightData },
      { new: true, upsert: true }
    );

    res.json({
      status: 'success',
      message: 'Data updated and risk recalculated',
      data: updatedInsight
    });
  } catch (error) {
    console.error('Add data error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   PATCH /api/diseases/:diseaseId/review
// @desc    Mark an insight as reviewed
router.patch('/:diseaseId/review', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const updated = await DiseaseInsight.findOneAndUpdate(
      { clerkId, diseaseId },
      { $set: { reviewedAt: new Date() } },
      { new: true }
    );

    res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
