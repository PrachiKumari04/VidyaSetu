const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  // Step 1: Biometrics
  age: Number,
  gender: String,
  height: Number, // in cm
  weight: Number, // in kg
  bmi: Number,
  bmiCategory: String,

  // Step 2: Lifestyle
  activityLevel: String,
  sleepHours: String,
  stressLevel: String,
  isSmoker: Boolean,
  alcoholConsumption: String,

  // Step 3: Diet
  dietType: String,
  sugarIntake: String,
  saltIntake: String,
  eatsLeafyGreens: Boolean,
  eatsFruits: Boolean,
  junkFoodFrequency: String,

  // Step 4: Medical
  allergies: [String],
  medicalHistory: [String],
  otherConditions: String,
  
  onboardingComplete: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
