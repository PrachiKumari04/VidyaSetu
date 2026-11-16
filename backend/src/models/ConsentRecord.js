const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  decisions: {
    hospitalCare: { type: Boolean, default: true },       // Mandatory for hospital care
    aiAssistedSummary: { type: Boolean, default: true },  // Assistive AI clinical summary
    abhaLinkage: { type: Boolean, default: false },       // ABDM ABHA integration
    abdmRecordSharing: { type: Boolean, default: false }, // Sharing across hospitals
    documentRetention: { type: Boolean, default: true },  // Keep documents on timeline
    notifications: { type: Boolean, default: true }       // SMS / App queue updates
  },
  history: [{
    category: String,
    decision: Boolean,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);
