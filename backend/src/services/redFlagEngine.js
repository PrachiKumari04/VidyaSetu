// Clinician-approved safety rules (Chapter 5.6, 6.3)
// Derived from WHO Emergency Triage, AIIMS Triage Protocols, and ICMR STW
const RED_FLAG_RULES = [
  {
    ruleId: 'RF-01',
    description: 'Acute Coronary Syndrome / Myocardial Infarction indicators',
    keywords: ['chest pain', 'chest tightness', 'sweating', 'radiating to left arm', 'jaw pain', 'left arm pain'],
    requiredKeywordCount: 2,
    level: 'EMERGENCY',
    guideline: 'WHO Emergency Care & AIIMS Cardiology Triage'
  },
  {
    ruleId: 'RF-02',
    description: 'Severe Respiratory Distress / Hypoxia',
    keywords: ['difficulty breathing', 'gasping', 'shortness of breath', 'choking', 'cannot breathe', 'severe breathlessness'],
    requiredKeywordCount: 1,
    vitalCheck: (vitals) => vitals && vitals.spO2 && vitals.spO2 < 90,
    level: 'EMERGENCY',
    guideline: 'WHO Hypoxia & Emergency Resuscitation Protocols'
  },
  {
    ruleId: 'RF-03',
    description: 'Acute Neurological Deficit / Stroke Suspect',
    keywords: ['sudden weakness', 'face drooping', 'arm weakness', 'slurred speech', 'facial numbness', 'one side weakness'],
    requiredKeywordCount: 1,
    level: 'EMERGENCY',
    guideline: 'FAST Stroke Protocol / AIIMS Emergency'
  },
  {
    ruleId: 'RF-04',
    description: 'Hypertensive Crisis / Malignant Hypertension',
    keywords: ['severe headache', 'blurred vision'],
    requiredKeywordCount: 0,
    vitalCheck: (vitals) => vitals && (vitals.bpSystolic >= 180 || vitals.bpDiastolic >= 120),
    level: 'EMERGENCY',
    guideline: 'JNC-8 Hypertensive Emergency Standards'
  },
  {
    ruleId: 'RF-05',
    description: 'Unresponsiveness / Syncope / Altered Sensorium',
    keywords: ['loss of consciousness', 'fainted', 'unconscious', 'blackout', 'seizure', 'fits'],
    requiredKeywordCount: 1,
    level: 'EMERGENCY',
    guideline: 'AIIMS Red Flag Triage Guidelines'
  },
  {
    ruleId: 'RF-06',
    description: 'Severe Active Bleeding / Hemorrhage',
    keywords: ['profuse bleeding', 'vomiting blood', 'coughing blood', 'severe bleeding', 'hematemesis'],
    requiredKeywordCount: 1,
    level: 'EMERGENCY',
    guideline: 'WHO Trauma & Hemorrhage Management'
  },
  {
    ruleId: 'RF-07',
    description: 'Severe Tachycardia / Hemodynamic Instability',
    keywords: ['palpitations', 'rapid heartbeat'],
    requiredKeywordCount: 0,
    vitalCheck: (vitals) => vitals && vitals.heartRate && vitals.heartRate > 130,
    level: 'URGENT',
    guideline: 'ICMR Adult Emergency Protocol'
  },
  {
    ruleId: 'RF-08',
    description: 'High Grade Pyrexia / Suspected Sepsis',
    keywords: ['chills', 'rigors', 'delirium'],
    requiredKeywordCount: 0,
    vitalCheck: (vitals) => vitals && vitals.temperature && vitals.temperature >= 104,
    level: 'URGENT',
    guideline: 'WHO Integrated Management of Adult Illness'
  }
];

/**
 * Pure Rule-First Safety Evaluator
 * Runs entirely before any LLM/AI model invocation.
 */
function evaluateRedFlags(symptomList = [], vitals = {}) {
  const combinedText = symptomList
    .map(s => (typeof s === 'string' ? s : s.text || ''))
    .join(' ')
    .toLowerCase();

  const matchedRules = [];

  for (const rule of RED_FLAG_RULES) {
    let keywordMatches = 0;
    if (rule.keywords && rule.keywords.length > 0) {
      for (const kw of rule.keywords) {
        if (combinedText.includes(kw.toLowerCase())) {
          keywordMatches++;
        }
      }
    }

    const keywordConditionMet = rule.requiredKeywordCount > 0 
      ? keywordMatches >= rule.requiredKeywordCount 
      : false;

    let vitalConditionMet = false;
    if (rule.vitalCheck && typeof rule.vitalCheck === 'function') {
      try {
        vitalConditionMet = Boolean(rule.vitalCheck(vitals));
      } catch (err) {
        vitalConditionMet = false;
      }
    }

    if (keywordConditionMet || vitalConditionMet) {
      matchedRules.push({
        ruleId: rule.ruleId,
        description: rule.description,
        level: rule.level,
        guideline: rule.guideline
      });
    }
  }

  const hasEmergency = matchedRules.some(r => r.level === 'EMERGENCY');
  const hasUrgent = matchedRules.some(r => r.level === 'URGENT');

  return {
    isFlagged: matchedRules.length > 0,
    priority: hasEmergency ? 'emergency' : (hasUrgent ? 'urgent' : 'routine'),
    matchedRules
  };
}

module.exports = {
  RED_FLAG_RULES,
  evaluateRedFlags
};
