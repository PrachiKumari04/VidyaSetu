const express = require('express');
const router = express.Router();
const Encounter = require('../models/Encounter');
const { evaluateRedFlags } = require('../services/redFlagEngine');
const { getAdaptiveQuestions } = require('../services/questionEngine');
const { issueEncounterToken } = require('../services/queueService');
const { generateClinicalSummary } = require('../services/clinicalSummaryService');
const UserProfile = require('../models/UserProfile');

/**
 * 1. Start Intake: Create Encounter + Run Red-Flag Safety Engine First
 */
router.post('/start', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age,
      gender,
      complaint,
      symptoms = [],
      vitals = {},
      clinicalMode = 'modern',
      departmentId = 'General OPD',
      doctorId = 'doc_default',
      doctorName = 'OPD Duty Doctor'
    } = req.body;

    if (!patientId || !complaint) {
      return res.status(400).json({ error: 'patientId and complaint are required' });
    }

    // STEP 1: SAFETY FIRST - Run Rule-based Red Flag Engine BEFORE any AI
    const redFlagResult = evaluateRedFlags(symptoms.length > 0 ? symptoms : [complaint], vitals);

    const encounter = await Encounter.create({
      patientId,
      patientName: patientName || 'Patient',
      age: Number(age) || 30,
      gender: gender || 'Unspecified',
      complaint,
      clinicalMode,
      departmentId,
      doctorId,
      doctorName,
      symptoms: symptoms.map(s => typeof s === 'string' ? { text: s, method: 'text' } : s),
      vitals,
      redFlags: redFlagResult.matchedRules.map(r => ({
        ruleId: r.ruleId,
        symptom: r.description,
        level: r.level,
        guideline: r.guideline
      })),
      triagePriority: redFlagResult.priority,
      status: 'intake',
      auditLog: [{
        action: 'INTAKE_STARTED',
        performedBy: patientId,
        details: `Intake started. Red-flag evaluation: ${redFlagResult.priority}`
      }]
    });

    // STEP 2: Fetch Adaptive Follow-up questions (4-5 items tailored to mode & profile)
    const profile = await UserProfile.findOne({ clerkId: patientId });
    const adaptiveQuestions = getAdaptiveQuestions(clinicalMode, profile || {});

    res.status(201).json({
      success: true,
      encounterId: encounter._id,
      triagePriority: redFlagResult.priority,
      redFlags: redFlagResult.matchedRules,
      adaptiveQuestions
    });
  } catch (err) {
    console.error('Intake start error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Submit Answers to Adaptive Questions
 */
router.post('/:id/answers', async (req, res) => {
  try {
    const { answers = [] } = req.body; // [{ questionId, question, answer }]
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    encounter.adaptiveAnswers = answers;
    await encounter.save();

    res.json({ success: true, message: 'Adaptive answers recorded', count: answers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Finalize Intake & Issue Real-Time Queue Token
 */
router.post('/:id/finalize-token', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    const io = req.app.get('io');
    const token = await issueEncounterToken({
      encounterId: encounter._id,
      patientId: encounter.patientId,
      patientName: encounter.patientName,
      age: encounter.age,
      gender: encounter.gender,
      doctorId: encounter.doctorId,
      doctorName: encounter.doctorName,
      departmentId: encounter.departmentId,
      priority: encounter.triagePriority,
      io
    });

    // Pre-generate the 30-sec AI clinical summary in background for the doctor
    generateClinicalSummary(encounter._id).catch(e => console.warn('Async summary generation failed:', e.message));

    res.json({
      success: true,
      tokenNumber: token.tokenNumber,
      qrCode: token.qrCode,
      position: token.position,
      estimatedWaitMinutes: token.estimatedWaitMinutes,
      priority: token.priority
    });
  } catch (err) {
    console.error('Finalize token error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
