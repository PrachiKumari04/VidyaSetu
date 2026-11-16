const express = require('express');
const router = express.Router();
const QueueToken = require('../models/QueueToken');
const { getDoctorLiveQueue, callNextPatient } = require('../services/queueService');

/**
 * 1. Fetch live queue for doctor console
 */
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const queue = await getDoctorLiveQueue(doctorId);
    res.json({ success: true, count: queue.length, queue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Doctor calls next patient (Prioritized: Emergency > Urgent > Routine)
 */
router.post('/doctor/:doctorId/call-next', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const io = req.app.get('io');
    const calledToken = await callNextPatient({ doctorId, io });

    if (!calledToken) {
      return res.json({ success: false, message: 'No waiting patients in queue' });
    }

    res.json({ success: true, calledToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Patient checks their own token status
 */
router.get('/patient/:patientId/current', async (req, res) => {
  try {
    const { patientId } = req.params;
    const activeToken = await QueueToken.findOne({
      patientId,
      status: { $in: ['waiting', 'called', 'in-consultation'] }
    }).sort({ createdAt: -1 });

    if (!activeToken) {
      return res.json({ success: false, message: 'No active queue token found' });
    }

    // Recompute current position
    const waitingAhead = await QueueToken.countDocuments({
      doctorId: activeToken.doctorId,
      status: 'waiting',
      createdAt: { $lt: activeToken.createdAt }
    });

    const livePosition = activeToken.status === 'called' ? 0 : waitingAhead + 1;
    const estimatedWaitMinutes = Math.max(0, waitingAhead * 8);

    res.json({
      success: true,
      token: {
        ...activeToken.toObject(),
        position: livePosition,
        estimatedWaitMinutes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
