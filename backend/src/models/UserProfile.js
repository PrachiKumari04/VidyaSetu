const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  // Step 1: Biometrics
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  height: Number, // in cm
  weight: Number, // in kg
  bmi: Number,
  bmiCategory: String,

  // Step 2: Lifestyle
  activityLevel: {
    type: String,
    enum: ['Sedentary', 'Moderate', 'Active']
  },
  sleepHours: {
    type: String,
    enum: ['<5', '5-7', '7-9', '>9']
  },
  stressLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  isSmoker: Boolean,
  alcoholConsumption: {
    type: String,
    enum: ['Never', 'Occasionally', 'Frequently']
  },

  // Step 3: Diet
  dietType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Mixed']
  },
  sugarIntake: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  saltIntake: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  eatsLeafyGreens: Boolean,
  eatsFruits: Boolean,
  junkFoodFrequency: {
    type: String,
    enum: ['Rare', 'Weekly', 'Daily']
  },

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
