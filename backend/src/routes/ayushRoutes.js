const express = require('express');
const router = express.Router();
const { getAdaptiveQuestions } = require('../services/questionEngine');

/**
 * AYUSH Clinical Assessment Intake (Mode 2 per Chapter 5.7)
 * Captures: Prakriti, Agni, Koshtha, Ahara, Vihara, Nidana
 */
router.get('/questions', (req, res) => {
  try {
    const questions = getAdaptiveQuestions('ayush', {});
    res.json({ success: true, mode: 'ayush', questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assess', (req, res) => {
  try {
    const { answers = {} } = req.body;
    // Map patient responses to classical Ayurvedic dosha tendency
    let vataScore = 0, pittaScore = 0, kaphaScore = 0;

    const answersStr = JSON.stringify(answers).toLowerCase();
    if (answersStr.includes('vata') || answersStr.includes('irregular') || answersStr.includes('cold') || answersStr.includes('insomnia')) {
      vataScore += 2;
    }
    if (answersStr.includes('pitta') || answersStr.includes('intense') || answersStr.includes('spicy') || answersStr.includes('sharp')) {
      pittaScore += 2;
    }
    if (answersStr.includes('kapha') || answersStr.includes('sluggish') || answersStr.includes('heavy') || answersStr.includes('sound sleep')) {
      kaphaScore += 2;
    }

    const dominantDosha = vataScore >= pittaScore && vataScore >= kaphaScore ? 'Vata' : (pittaScore >= kaphaScore ? 'Pitta' : 'Kapha');

    res.json({
      success: true,
      mode: 'ayush',
      preliminaryAssessment: {
        dominantDosha,
        scores: { vata: vataScore, pitta: pittaScore, kapha: kaphaScore },
        clinicalNote: 'Assistive patient-reported Ayurvedic intake for Vaidya/Clinician verification.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
