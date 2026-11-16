const Encounter = require('../models/Encounter');
const UserProfile = require('../models/UserProfile');
const { callGroqChat } = require('../utils/aiModelHelper');

/**
 * Builds a structured, source-tagged AI clinical summary for the doctor.
 * Adheres strictly to Chapter 5.4, 5.6:
 * - Assistive draft only
 * - Source tags on every fact: 'patient-reported', 'document-derived', 'device-measured', 'uncertain', 'conflicting'
 * - Red flags surfaced at top
 * - Timeline comparison of what changed since last visit
 */
async function generateClinicalSummary(encounterId) {
  const encounter = await Encounter.findById(encounterId);
  if (!encounter) throw new Error('Encounter not found');

  const profile = await UserProfile.findOne({ clerkId: encounter.patientId });

  // Gather history of prior encounters for longitudinal change detection
  const priorEncounters = await Encounter.find({
    patientId: encounter.patientId,
    _id: { $ne: encounter._id },
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(3);

  // Source-tagged clinical facts
  const clinicalFacts = {
    redFlags: encounter.redFlags || [],
    triagePriority: encounter.triagePriority,
    chiefComplaint: {
      text: encounter.complaint,
      source: 'patient-reported'
    },
    symptoms: (encounter.symptoms || []).map(s => ({
      text: s.text,
      source: s.source || 'patient-reported',
      method: s.method,
      location: s.bodyLocation
    })),
    adaptiveAnswers: encounter.adaptiveAnswers || [],
    painLocalization: (encounter.painAreas || []).map(p => ({
      region: p.label,
      intensity: p.intensity,
      quality: p.quality,
      source: 'patient-bodymap'
    })),
    vitals: encounter.vitals ? {
      ...encounter.vitals.toObject ? encounter.vitals.toObject() : encounter.vitals,
      source: encounter.vitals.source || 'patient-reported'
    } : null,
    knownConditions: (profile?.chronicConditions || []).map(c => ({
      name: c,
      source: 'patient-reported'
    })),
    knownAllergies: (profile?.allergies || []).map(a => ({
      name: a,
      source: 'patient-reported'
    })),
    currentMedications: (profile?.medications || []).map(m => ({
      name: typeof m === 'string' ? m : m.name,
      dosage: m.dosage || 'Standard',
      source: 'patient-reported'
    })),
    documentsReviewed: (encounter.documents || []).map(d => ({
      fileName: d.fileName,
      ocrConfidence: d.ocrConfidence,
      source: d.ocrConfidence > 0.75 ? 'document-derived' : 'uncertain'
    }))
  };

  // Change detection vs previous encounter
  const changes = [];
  if (priorEncounters.length > 0) {
    const last = priorEncounters[0];
    if (last.vitals && encounter.vitals) {
      if (last.vitals.bpSystolic && encounter.vitals.bpSystolic) {
        const diff = encounter.vitals.bpSystolic - last.vitals.bpSystolic;
        if (Math.abs(diff) >= 10) {
          changes.push(`Systolic BP shifted by ${diff > 0 ? '+' : ''}${diff} mmHg compared to prior visit on ${last.createdAt.toLocaleDateString()}`);
        }
      }
    }
    if (last.complaint !== encounter.complaint) {
      changes.push(`New acute complaint presenting: "${encounter.complaint}" (Previous: "${last.complaint}")`);
    }
  } else {
    changes.push('First recorded OPD encounter for this patient.');
  }

  // LLM Synthesis (assistive summary drafting)
  let conciseDraft = `Patient presents with ${encounter.complaint}. Symptoms noted: ${(encounter.symptoms || []).map(s => s.text).join(', ') || 'None detailed'}. Priority evaluated as ${encounter.triagePriority.toUpperCase()}.`;

  try {
    const prompt = `You are a clinical intake assistant drafting an assistive 30-second summary for an OPD doctor in an Indian hospital.
Keep it strictly factual, telegraphic, and under 120 words.
DO NOT diagnose or prescribe.
Highlight any Red Flags first.

DATA:
- Complaint: ${encounter.complaint}
- Symptoms: ${JSON.stringify(clinicalFacts.symptoms)}
- Vitals: ${JSON.stringify(clinicalFacts.vitals)}
- Known Conditions: ${JSON.stringify(clinicalFacts.knownConditions)}
- Allergies: ${JSON.stringify(clinicalFacts.knownAllergies)}
- Changes: ${JSON.stringify(changes)}
- Red Flags: ${JSON.stringify(clinicalFacts.redFlags)}

Produce a clean summary for the physician.`;

    const response = await callGroqChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });
    
    if (response?.choices?.[0]?.message?.content) {
      conciseDraft = response.choices[0].message.content.trim();
    }
  } catch (err) {
    console.warn('[Clinical Summary] LLM draft fallback used:', err.message);
  }

  const summaryPayload = {
    conciseDraft,
    clinicalFacts,
    changes,
    provenance: {
      generatedAt: new Date(),
      model: 'groq/compound',
      disclaimer: 'Assistive clinical draft for clinician review. Does not constitute autonomous medical diagnosis.'
    }
  };

  // Update encounter
  encounter.aiSummary = {
    draft: summaryPayload,
    action: 'pending',
    generatedAt: new Date(),
    modelUsed: 'groq/compound',
    version: '1.0'
  };
  await encounter.save();

  return summaryPayload;
}

module.exports = {
  generateClinicalSummary
};
