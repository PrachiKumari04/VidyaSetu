const express = require('express');
const router = express.Router();
const ConsentRecord = require('../models/ConsentRecord');

/**
 * 1. Fetch patient consent decisions
 */
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    let consent = await ConsentRecord.findOne({ patientId });
    if (!consent) {
      consent = await ConsentRecord.create({ patientId });
    }
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Update specific consent decision (DPDP 2023 compliance)
 */
router.post('/:patientId/update', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category, decision } = req.body;

    let consent = await ConsentRecord.findOne({ patientId });
    if (!consent) consent = new ConsentRecord({ patientId });

    if (consent.decisions[category] !== undefined) {
      consent.decisions[category] = Boolean(decision);
      consent.history.push({
        category,
        decision: Boolean(decision),
        updatedAt: new Date()
      });
      await consent.save();
    }

    res.json({ success: true, message: 'Consent updated successfully', consent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
