const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true }, // Clerk user ID or Guest Kiosk ID
  patientName: { type: String, default: 'Anonymous Patient' },
  age: { type: Number },
  gender: { type: String },
  doctorId: { type: String, default: 'doc_default' },
  doctorName: { type: String },
  departmentId: { type: String, default: 'General OPD' },
  clinicalMode: { type: String, enum: ['modern', 'ayush'], default: 'modern' },
  serviceType: { type: String, enum: ['opd', 'lab', 'followup'], default: 'opd' },
  whoNeedsCare: {
    recipient: { type: String, enum: ['self', 'family'], default: 'self' },
    relation: String,
    name: String,
    age: Number,
    gender: String
  },
  
  // Intake Details
  complaint: { type: String, required: true },
  symptoms: [{
    text: String,
    method: { type: String, enum: ['voice', 'text', 'bodymap', 'quickcard'] },
    bodyLocation: String,
    source: { type: String, default: 'patient-reported' }
  }],
  painAreas: [{
    id: String,
    label: String,
    view: String,
    intensity: String,
    quality: String,
    redFlagKey: String
  }],
  adaptiveAnswers: [{
    questionId: String,
    question: String,
    answer: String
  }],
  
  // Red Flag Safety Triage
  redFlags: [{
    ruleId: String,
    symptom: String,
    level: { type: String, enum: ['EMERGENCY', 'URGENT'] },
    guideline: String,
    confirmedBy: String,
    confirmedAt: Date
  }],
  triagePriority: { type: String, enum: ['emergency', 'urgent', 'routine'], default: 'routine' },
  
  // AI Clinical Summary (Draft for doctor)
  aiSummary: {
    draft: { type: Object },
    verifiedBy: String,
    action: { type: String, enum: ['pending', 'accepted', 'edited', 'rejected'], default: 'pending' },
    doctorEdits: { type: Object },
    generatedAt: Date,
    modelUsed: String,
    version: { type: String, default: '1.0' }
  },
  
  // Attached Vitals & Documents
  vitals: {
    bpSystolic: Number,
    bpDiastolic: Number,
    heartRate: Number,
    temperature: Number,
    spO2: Number,
    weight: Number,
    source: { type: String, default: 'patient-reported' } // 'patient-reported' or 'device-measured'
  },
  documents: [{
    fileName: String,
    fileUrl: String,
    documentType: String,
    ocrText: String,
    ocrConfidence: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Doctor Consultation Output
  diagnosis: String,
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    notes: String,
    handwrittenRxImage: String,
    handwrittenOcrText: String
  },
  advice: String,
  labOrders: [{
    testName: String,
    instructions: String,
    status: { type: String, enum: ['ordered', 'collected', 'processing', 'completed'], default: 'ordered' },
    labResultId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabResult' }
  }],
  referral: {
    department: String,
    hospital: String,
    reason: String
  },
  followUp: {
    required: { type: Boolean, default: false },
    date: Date,
    window: String,
    parentEncounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' }
  },
  
  // Status & Audit
  status: {
    type: String,
    enum: ['intake', 'queued', 'in-consultation', 'lab-pending', 'completed', 'cancelled'],
    default: 'intake',
    index: true
  },
  consultDurationMin: { type: Number, default: 0 },
  consultStartedAt: Date,
  consultEndedAt: Date,
  
  auditLog: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    details: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Encounter', encounterSchema);
