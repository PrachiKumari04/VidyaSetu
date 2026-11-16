const express = require('express');
const router = express.Router();
const Encounter = require('../models/Encounter');
const LabResult = require('../models/LabResult');

/**
 * 1. Fetch pending & active lab orders for the Lab Technician Dashboard
 */
router.get('/pending', async (req, res) => {
  try {
    const encounters = await Encounter.find({
      'labOrders.0': { $exists: true }
    }).sort({ updatedAt: -1 }).limit(50);

    const labQueue = [];
    for (const enc of encounters) {
      for (const order of enc.labOrders) {
        labQueue.push({
          encounterId: enc._id,
          orderId: order._id,
          patientId: enc.patientId,
          patientName: enc.patientName,
          age: enc.age,
          gender: enc.gender,
          doctorName: enc.doctorName || 'Dr. R. Sharma (MD)',
          testName: order.testName,
          instructions: order.instructions || 'Standard OPD Lab Panel',
          status: order.status || 'ordered',
          orderedAt: enc.updatedAt,
          labResultId: order.labResultId
        });
      }
    }

    res.json({ success: true, count: labQueue.length, orders: labQueue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Collect sample (QR/Barcode scanning workflow)
 */
router.post('/:encounterId/order/:orderId/sample', async (req, res) => {
  try {
    const { encounterId, orderId } = req.params;
    const { sampleBarcode = `SMP-${Date.now().toString(36).toUpperCase()}` } = req.body;

    const enc = await Encounter.findById(encounterId);
    if (!enc) return res.status(404).json({ error: 'Encounter not found' });

    const order = enc.labOrders.id(orderId);
    if (!order) return res.status(404).json({ error: 'Lab order not found' });

    order.status = 'collected';
    order.instructions = `${order.instructions || ''} [Sample Barcode: ${sampleBarcode}]`;

    enc.auditLog.push({
      action: 'LAB_SAMPLE_COLLECTED',
      performedBy: 'Lab Technician',
      details: `Sample collected for ${order.testName}. Barcode: ${sampleBarcode}`
    });

    await enc.save();
    res.json({ success: true, message: 'Sample collection logged', sampleBarcode, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Enter and finalize laboratory test results
 */
router.post('/:encounterId/order/:orderId/results', async (req, res) => {
  try {
    const { encounterId, orderId } = req.params;
    const { resultValue, unit, referenceRange, notes, isAbnormal } = req.body;

    const enc = await Encounter.findById(encounterId);
    if (!enc) return res.status(404).json({ error: 'Encounter not found' });

    const order = enc.labOrders.id(orderId);
    if (!order) return res.status(404).json({ error: 'Lab order not found' });

    // Create LabResult document
    const labResult = await LabResult.create({
      clerkId: enc.patientId,
      testName: order.testName,
      labName: 'MediKiosk Central Hospital Pathology Lab',
      resultValue,
      unit: unit || 'mg/dL',
      referenceRange: referenceRange || 'Normal',
      sampleDate: new Date(),
      source: 'hospital-lab',
      reportRef: notes || ''
    });

    order.status = 'completed';
    order.labResultId = labResult._id;

    // Check if all lab orders are complete
    const allDone = enc.labOrders.every(o => o.status === 'completed');
    if (allDone) {
      enc.status = 'completed';
    }

    enc.auditLog.push({
      action: 'LAB_RESULT_SUBMITTED',
      performedBy: 'Lab Technician',
      details: `Result entered for ${order.testName}: ${resultValue} ${unit}. Abnormal: ${Boolean(isAbnormal)}`
    });

    await enc.save();

    res.json({ 
      success: true, 
      message: 'Lab result submitted and linked to patient encounter', 
      labResult,
      order 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
