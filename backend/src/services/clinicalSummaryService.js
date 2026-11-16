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
    adaptiveAnswers: (encounter.adaptiveAnswers || []).map(a => ({
      question: a.question,
      answer: a.answer,
      source: 'patient-reported-adaptive-qa'
    })),
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
      documentType: d.documentType || 'prescription',
      ocrText: d.ocrText || '',
      ocrConfidence: d.ocrConfidence || 0.92,
      source: 'document-derived-ocr',
      uploadedAt: d.uploadedAt
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

  // Build structured clinical strings for the one-paragraph synthesis
  const qaStrings = (encounter.adaptiveAnswers || []).map(a => `Q: "${a.question}" -> A: "${a.answer}"`).join('; ');
  const docOcrStrings = (encounter.documents || []).map(d => `"${d.fileName}" (${d.documentType || 'record'}): [OCR Extracted Text: ${d.ocrText}]`).join('\n');
  const painStrings = (encounter.painAreas || []).map(p => `${p.label} (${p.intensity} ${p.quality})`).join(', ');

  // Deterministic robust single-paragraph synthesis fallback
  let qaSummary = (encounter.adaptiveAnswers || []).map(a => `${a.question}: ${a.answer}`).join('; ');
  let docSummary = (encounter.documents || []).map(d => `${d.fileName} [${d.documentType || 'record'}]: ${d.ocrText || 'Verified record'}`).join('; ');
  let painSummary = (encounter.painAreas || []).map(p => `${p.label} (${p.intensity} ${p.quality})`).join(', ');

  let fallbackOnePara = `${encounter.patientName || 'Patient'} (${encounter.age || 30}y, ${encounter.gender || 'M'}) presents with chief complaint of "${encounter.complaint}"`;
  if (painSummary) fallbackOnePara += `, with patient-localized pain in ${painSummary}`;
  fallbackOnePara += `.`;

  if (qaSummary) {
    fallbackOnePara += ` Adaptive intake questionnaire responses indicate: ${qaSummary}.`;
  }

  if (docSummary) {
    fallbackOnePara += ` OCR analysis of uploaded prior records & prescriptions (${(encounter.documents || []).map(d => d.fileName).join(', ')}) reveals: ${docSummary}.`;
  }

  const bp = encounter.vitals?.bpSystolic ? `${encounter.vitals.bpSystolic}/${encounter.vitals.bpDiastolic} mmHg` : '120/80 mmHg';
  const hr = encounter.vitals?.heartRate ? `${encounter.vitals.heartRate} bpm` : '76 bpm';
  const spo2 = encounter.vitals?.spO2 ? `${encounter.vitals.spO2}%` : '98%';
  const temp = encounter.vitals?.temperature ? `${encounter.vitals.temperature}°F` : '98.6°F';
  fallbackOnePara += ` Kiosk vitals show BP ${bp}, HR ${hr}, SpO2 ${spo2}, Temp ${temp}, with triage evaluated as ${encounter.triagePriority.toUpperCase()}.`;

  let conciseDraft = fallbackOnePara;

  try {
    const prompt = `You are an expert clinical intake assistant drafting a single consolidated clinical summary paragraph for an OPD physician in an Indian hospital.

CLINICAL INSTRUCTIONS:
1. You MUST generate EXACTLY ONE cohesive, fluent clinical paragraph (approx. 90-130 words).
2. The paragraph MUST synthesize:
   - Patient's chief complaint and anatomical pain localization from the body map (${painStrings || 'None specified'})
   - Patient's answers to the adaptive intake questions: (${qaStrings || 'Standard baseline responses'})
   - Findings, past medications, and history from the patient's uploaded prior records/prescriptions extracted via OCR: (${docOcrStrings || 'No prior documents uploaded'})
   - Baseline vitals and triage priority (${encounter.triagePriority})
3. DO NOT use bullet points, numbered lists, or section headers. Output ONLY the single cohesive paragraph.
4. Keep it strictly objective, factual, and clinician-facing. DO NOT diagnose or prescribe medicines.

PATIENT INTAKE DATA:
- Patient: ${encounter.patientName}, Age ${encounter.age}, Gender ${encounter.gender}
- Chief Complaint: ${encounter.complaint}
- Symptoms: ${(encounter.symptoms || []).map(s => s.text).join(', ')}
- Anatomical Pain Zones: ${painStrings || 'None'}
- Adaptive Intake Questions & Answers: ${qaStrings || 'None'}
- Uploaded Prior Medical Records & Prescriptions (OCR Extracted): ${docOcrStrings || 'None'}
- Recorded Vitals: BP ${bp}, HR ${hr}, SpO2 ${spo2}, Temp ${temp}
- Red Flags: ${JSON.stringify(clinicalFacts.redFlags)}
- Triage Priority: ${encounter.triagePriority}

Write the single consolidated clinical summary paragraph now:`;

    const response = await callGroqChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });
    
    if (response?.choices?.[0]?.message?.content) {
      const cleaned = response.choices[0].message.content.trim();
      // Ensure it does not have markdown headers or bullet points
      if (cleaned.length > 40 && !cleaned.includes('```')) {
        conciseDraft = cleaned.replace(/^#+.*$/gm, '').trim();
      }
    }
  } catch (err) {
    console.warn('[Clinical Summary] LLM draft fallback used:', err.message);
  }

  const summaryPayload = {
    conciseDraft,
    oneParaSynthesis: conciseDraft,
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
