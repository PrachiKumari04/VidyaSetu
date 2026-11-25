// Question Bank for Modern Medicine and AYUSH Modes
// Questions are clinical configurations, not static black-box code.

const MODERN_QUESTIONS = [
  {
    id: 'MQ-01',
    field: 'duration',
    text: 'How long have you been experiencing these symptoms?',
    hi: 'आप इन लक्षणों को कितने समय से महसूस कर रहे हैं?',
    type: 'choice',
    options: ['Since today', '2-3 days', 'About a week', 'More than a month']
  },
  {
    id: 'MQ-02',
    field: 'severity',
    text: 'On a scale of 1 to 10, how severe is your discomfort?',
    hi: '1 से 10 के पैमाने पर, आपकी तकलीफ़ कितनी गंभीर है?',
    type: 'scale',
    min: 1,
    max: 10,
    options: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Extreme / Unbearable)']
  },
  {
    id: 'MQ-03',
    field: 'allergies',
    text: 'Do you have any known drug or environmental allergies?',
    hi: 'क्या आपको किसी दवा या खाद्य पदार्थ से एलर्जी है?',
    type: 'choice',
    options: ['None', 'Penicillin / Antibiotics', 'Dust / Pollen', 'Other medication'],
    skipIfFieldPresent: 'allergies'
  },
  {
    id: 'MQ-04',
    field: 'currentMedications',
    text: 'Are you actively taking any prescription or regular medications?',
    hi: 'क्या आप वर्तमान में कोई नियमित दवाइयाँ ले रहे हैं?',
    type: 'text',
    options: ['None / No regular medications', 'Blood Pressure medication', 'Diabetes medication (Insulin/Metformin)', 'Thyroid medication', 'Other prescription'],
    skipIfFieldPresent: 'medications'
  },
  {
    id: 'MQ-05',
    field: 'chronicConditions',
    text: 'Do you have existing medical conditions like Diabetes or Hypertension?',
    hi: 'क्या आपको मधुमेह, उच्च रक्तचाप या थायराइड जैसी पुरानी बीमारियाँ हैं?',
    type: 'choice',
    options: ['None', 'Diabetes', 'Hypertension (High BP)', 'Heart Condition', 'Asthma'],
    skipIfFieldPresent: 'chronicConditions'
  }
];

const AYUSH_QUESTIONS = [
  {
    id: 'AQ-01',
    field: 'prakriti',
    text: 'Which constitution corresponds best with your body nature? (Prakriti)',
    hi: 'आपकी शारीरिक प्रकृति किस प्रकार की है?',
    type: 'choice',
    options: ['Vata (Cold/Dry/Light)', 'Pitta (Warm/Sharp/Acidic)', 'Kapha (Heavy/Slow/Calm)', 'Not sure']
  },
  {
    id: 'AQ-02',
    field: 'agni',
    text: 'How is your digestion and appetite? (Agni assessment)',
    hi: 'आपकी पाचन शक्ति और भूख कैसी है? (अग्नि परीक्षा)',
    type: 'choice',
    options: ['Sama (Normal, regular hunger)', 'Tikshna (Intense, burns quickly)', 'Manda (Sluggish, heavy after food)', 'Visham (Irregular)']
  },
  {
    id: 'AQ-03',
    field: 'koshtha',
    text: 'What is the natural state of your bowel movements? (Koshtha)',
    hi: 'आपकी मल त्याग की प्रवृत्ति कैसी है? (कोष्ठ परीक्षा)',
    type: 'choice',
    options: ['Mridu (Soft/Frequent)', 'Madhyama (Regular/Formed)', 'Krura (Hard/Constipated)']
  },
  {
    id: 'AQ-04',
    field: 'nidana',
    text: 'What lifestyle or dietary trigger do you suspect caused this? (Nidana)',
    hi: 'आपके अनुसार इस परेशानी का मुख्य कारण क्या हो सकता है? (निदान)',
    type: 'choice',
    options: ['Excess cold/dry food', 'Spicy/fried food', 'Late night sleep/stress', 'Weather change', 'Overexertion']
  },
  {
    id: 'AQ-05',
    field: 'vihara',
    text: 'How is your regular sleep schedule and physical rest?',
    hi: 'आपकी नींद का चक्र और दैनिक दिनचर्या कैसी है?',
    type: 'choice',
    options: ['Sound sleep (6-8 hrs)', 'Disturbed / Waking up often', 'Insomnia / Difficulty sleeping', 'Excessive drowsiness']
  }
];

/**
 * Returns 4-5 adaptive questions based on clinical mode and profile completeness
 */
function getAdaptiveQuestions(mode = 'modern', userProfile = {}) {
  const bank = mode === 'ayush' ? AYUSH_QUESTIONS : MODERN_QUESTIONS;
  
  const selected = [];
  for (const q of bank) {
    if (q.skipIfFieldPresent && userProfile[q.skipIfFieldPresent]) {
      const val = userProfile[q.skipIfFieldPresent];
      if (Array.isArray(val) && val.length > 0) continue;
      if (typeof val === 'string' && val.trim().length > 0) continue;
    }
    selected.push(q);
    if (selected.length >= 5) break;
  }

  return selected;
}

module.exports = {
  MODERN_QUESTIONS,
  AYUSH_QUESTIONS,
  getAdaptiveQuestions
};
