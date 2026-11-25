const express = require('express');
const router = express.Router();
const Encounter = require('../models/Encounter');
const QueueToken = require('../models/QueueToken');
const { getDoctorLiveQueue } = require('../services/queueService');

/**
 * 1. Fetch encounters for a specific patient (longitudinal timeline)
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const encounters = await Encounter.find({ patientId }).sort({ createdAt: -1 });
    res.json({ success: true, count: encounters.length, encounters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Fetch specific encounter details
 */
router.get('/:id', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });
    res.json({ success: true, encounter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Doctor completes consultation on encounter
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { diagnosis, prescription, advice, labOrders = [], referral, followUp } = req.body;
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) return res.status(404).json({ error: 'Encounter not found' });

    encounter.diagnosis = diagnosis || encounter.diagnosis;
    if (typeof prescription === 'string') {
      encounter.prescription = {
        notes: prescription,
        medicines: [{ name: prescription, dosage: '', frequency: '', duration: '' }]
      };
    } else if (prescription && typeof prescription === 'object') {
      encounter.prescription = prescription;
    }
    encounter.advice = advice || encounter.advice;
    encounter.labOrders = labOrders;
    encounter.referral = referral;
    encounter.followUp = followUp;
    encounter.status = labOrders.length > 0 ? 'lab-pending' : 'completed';
    encounter.consultEndedAt = new Date();
    
    if (encounter.consultStartedAt) {
      encounter.consultDurationMin = Math.round((encounter.consultEndedAt - encounter.consultStartedAt) / 60000);
    }

    encounter.auditLog.push({
      action: 'CONSULTATION_COMPLETED',
      performedBy: encounter.doctorName || 'Doctor',
      details: `Consultation finalized. Status: ${encounter.status}`
    });

    await encounter.save();

    // ── UPDATE QUEUE TOKEN STATUS ──
    // If lab orders exist -> 'lab-transit' (leaves doctor queue, routes to pathology lab)
    // If no lab orders -> 'completed' (leaves doctor queue)
    const targetStatus = labOrders.length > 0 ? 'lab-transit' : 'completed';
    const queueToken = await QueueToken.findOne({
      encounterId: encounter._id,
      status: { $in: ['waiting', 'called', 'in-consultation'] }
    });

    if (queueToken) {
      queueToken.status = targetStatus;
      if (targetStatus === 'completed') {
        queueToken.completedAt = new Date();
      }
      await queueToken.save();
    }

    // Real-time WebSocket synchronization across doctors and waiting displays
    const io = req.app.get('io');
    if (io) {
      const liveQueue = await getDoctorLiveQueue(encounter.doctorId || 'doc_default');
      io.to(`doctor:${encounter.doctorId || 'doc_default'}`).emit('queue:updated', {
        doctorId: encounter.doctorId || 'doc_default',
        queue: liveQueue
      });
      io.emit('queue:updated', {
        doctorId: encounter.doctorId || 'doc_default',
        queue: liveQueue
      });
      if (targetStatus === 'lab-transit') {
        io.emit('lab:orders:updated', {
          encounterId: encounter._id,
          patientName: encounter.patientName,
          labOrders: encounter.labOrders
        });
      }
    }

    res.json({ 
      success: true, 
      message: targetStatus === 'lab-transit' 
        ? 'Consultation finalized and patient routed to Pathology Lab' 
        : 'Consultation concluded and marked completed', 
      encounter,
      tokenStatus: targetStatus 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
