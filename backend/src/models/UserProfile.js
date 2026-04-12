const mongoose = require('mongoose');

const FieldSchema = {
  value: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now },
  updateType: { 
    type: String, 
    enum: ['initial', 'correction', 'real_change', 'auto_add', 'auto_remove', 'sync'],
    default: 'initial' 
  },
  previousValue: mongoose.Schema.Types.Mixed,
  unit: String
};

const UserProfileSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Step 1: Biometrics
  name: FieldSchema,
  age: FieldSchema,
  gender: FieldSchema,
  height: FieldSchema, // value in cm
  weight: FieldSchema, // value in kg
  bmi: FieldSchema,
  bmiCategory: FieldSchema,

  // Step 2: Lifestyle
  activityLevel: FieldSchema,
  sleepHours: FieldSchema,
  stressLevel: FieldSchema,
  isSmoker: FieldSchema,
  alcoholConsumption: FieldSchema,

  // Step 3: Diet
  dietType: FieldSchema,
  sugarIntake: FieldSchema,
  saltIntake: FieldSchema,
  eatsLeafyGreens: FieldSchema,
  eatsFruits: FieldSchema,
  junkFoodFrequency: FieldSchema,

  // Step 4: Medical
  // For arrays, value will be the array [String]
  allergies: FieldSchema,
  medicalHistory: FieldSchema,
  otherConditions: FieldSchema,
  
  onboardingComplete: {
    type: Boolean,
    default: true
  },
  
  // Data Quality Score (Phase B)
  dataQualityScore: {
    type: Number,
    default: 0
  },
  dataQualityLabel: {
    type: String,
    default: 'Basic'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Step 5: Platform Settings (Phase 1)
  settings: {
    language: { type: String, default: 'English' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    highContrast: { type: Boolean, default: false },
    reduceAnimations: { type: Boolean, default: false },
    voiceGuidance: { type: Boolean, default: false },
    measurementUnits: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    glucoseUnits: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
    defaultReminderTime: { type: String, default: '08:00 AM' },
    reminderSound: { type: String, default: 'Chime' },
    snoozeDuration: { type: Number, default: 10 }, // minutes
    refillAlertThreshold: { type: Number, default: 7 } // days
  }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
