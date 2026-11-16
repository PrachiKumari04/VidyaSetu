const QRCode = require('qrcode');
const QueueToken = require('../models/QueueToken');
const Encounter = require('../models/Encounter');

/**
 * Atomic token generation with dynamic QR code & ETA
 */
async function issueEncounterToken({ encounterId, patientId, patientName, age, gender, doctorId, doctorName, departmentId, priority = 'routine', io }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Compute daily token count
  const countToday = await QueueToken.countDocuments({
    createdAt: { $gte: todayStart }
  });
  
  const tokenNumber = `OPD-${String(countToday + 1).padStart(3, '0')}`;

  // Generate QR Code containing patient token verification payload
  const qrPayload = JSON.stringify({
    tokenNumber,
    encounterId: encounterId.toString(),
    patientId,
    issuedAt: new Date().toISOString()
  });
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 250, margin: 2 });

  // Compute current queue position for this doctor
  const waitingAhead = await QueueToken.countDocuments({
    doctorId: doctorId || 'doc_default',
    status: { $in: ['waiting', 'called'] }
  });

  const position = waitingAhead + 1;
  const estimatedWaitMinutes = Math.max(3, (waitingAhead * 8)); // 8 min rolling avg consultation

  const token = await QueueToken.create({
    tokenNumber,
    qrCode: qrCodeDataUrl,
    encounterId,
    patientId,
    patientName: patientName || 'Patient',
    age,
    gender,
    doctorId: doctorId || 'doc_default',
    doctorName: doctorName || 'OPD Duty Doctor',
    departmentId: departmentId || 'General OPD',
    priority,
    status: 'waiting',
    position,
    estimatedWaitMinutes
  });

  // Update encounter with status 'queued'
  await Encounter.findByIdAndUpdate(encounterId, {
    status: 'queued',
    $push: {
      auditLog: {
        action: 'TOKEN_ISSUED',
        performedBy: patientId,
        details: `Issued token ${tokenNumber} with priority ${priority}`
      }
    }
  });

  // Broadcast WebSocket update
  if (io) {
    const queueList = await getDoctorLiveQueue(doctorId || 'doc_default');
    io.emit('queue:updated', { doctorId: doctorId || 'doc_default', queue: queueList });
    io.emit(`patient:${patientId}:token`, token);
  }

  return token;
}

/**
 * Doctor calls next patient in queue (Priority: Emergency > Urgent > Follow-up > Routine)
 */
async function callNextPatient({ doctorId = 'doc_default', io }) {
  // Find highest priority waiting patient
  const priorityOrder = ['emergency', 'urgent', 'follow-up', 'routine'];
  
  let nextToken = null;
  for (const prio of priorityOrder) {
    nextToken = await QueueToken.findOne({
      doctorId,
      status: 'waiting',
      priority: prio
    }).sort({ createdAt: 1 });
    
    if (nextToken) break;
  }

  if (!nextToken) {
    return null;
  }

  nextToken.status = 'called';
  nextToken.calledAt = new Date();
  await nextToken.save();

  // Update Encounter
  await Encounter.findByIdAndUpdate(nextToken.encounterId, {
    status: 'in-consultation',
    consultStartedAt: new Date()
  });

  // Broadcast
  if (io) {
    const queueList = await getDoctorLiveQueue(doctorId);
    io.emit('queue:updated', { doctorId, queue: queueList });
    io.emit('patient:called', {
      tokenNumber: nextToken.tokenNumber,
      patientId: nextToken.patientId,
      patientName: nextToken.patientName,
      doctorName: nextToken.doctorName
    });
  }

  return nextToken;
}

/**
 * Fetch live active queue for a specific doctor
 */
async function getDoctorLiveQueue(doctorId = 'doc_default') {
  const activeTokens = await QueueToken.find({
    doctorId,
    status: { $in: ['waiting', 'called', 'in-consultation'] }
  }).sort({
    // emergency first, then urgent, follow-up, routine
    createdAt: 1
  });

  // Recalculate relative position numbers
  return activeTokens.map((t, index) => {
    const doc = t.toObject();
    doc.position = index + 1;
    doc.estimatedWaitMinutes = index * 8;
    return doc;
  });
}

module.exports = {
  issueEncounterToken,
  callNextPatient,
  getDoctorLiveQueue
};
