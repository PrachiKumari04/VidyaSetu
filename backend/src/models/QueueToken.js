const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, index: true }, // e.g. "OPD-001"
  qrCode: { type: String }, // Base64 data URL
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', required: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, default: 'Patient' },
  age: Number,
  gender: String,
  doctorId: { type: String, default: 'doc_default', index: true },
  doctorName: { type: String, default: 'OPD Duty Doctor' },
  departmentId: { type: String, default: 'General Medicine' },
  
  priority: {
    type: String,
    enum: ['emergency', 'urgent', 'follow-up', 'routine'],
    default: 'routine',
    index: true
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in-consultation', 'lab-transit', 'completed', 'no-show', 'cancelled'],
    default: 'waiting',
    index: true
  },
  
  position: { type: Number, default: 1 },
  estimatedWaitMinutes: { type: Number, default: 15 },
  
  issuedAt: { type: Date, default: Date.now },
  calledAt: Date,
  consultStartedAt: Date,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('QueueToken', queueTokenSchema);
