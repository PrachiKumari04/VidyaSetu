const express = require('express');
const router = express.Router();
const Encounter = require('../models/Encounter');
const { generateClinicalSummary } = require('../services/clinicalSummaryService');

/**
 * 1. Fetch or generate AI clinical summary for a specific encounter
 */
router.get('/:encounterId', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await Encounter.findById(encounterId);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    let summary = encounter.aiSummary?.draft;
    if (!summary) {
      summary = await generateClinicalSummary(encounterId);
    }

    res.json({
      success: true,
      encounterId,
      summary,
      action: encounter.aiSummary?.action || 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Doctor review action: accept, edit, or reject the AI clinical summary
 * (Human-in-the-loop requirement NFR-01, FR-15)
 */
router.post('/:encounterId/verify', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { action, doctorEdits, doctorId = 'doc_default' } = req.body; // action: 'accepted' | 'edited' | 'rejected'

    const encounter = await Encounter.findById(encounterId);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    encounter.aiSummary.action = action;
    encounter.aiSummary.verifiedBy = doctorId;
    if (doctorEdits) {
      encounter.aiSummary.doctorEdits = doctorEdits;
    }

    encounter.auditLog.push({
      action: `AI_SUMMARY_${action.toUpperCase()}`,
      performedBy: doctorId,
      details: `Doctor marked AI clinical draft as ${action}.`
    });

    await encounter.save();

    res.json({
      success: true,
      message: `AI Clinical Summary successfully marked as ${action}.`,
      aiSummary: encounter.aiSummary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
