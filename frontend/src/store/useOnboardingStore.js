import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOnboardingStore = create(
  persist(
    (set) => ({
      step: 1,
      formData: {
        // Step 1: Biometrics
        age: '',
        gender: '',
        height: '',
        weight: '',
        bmi: null,
        bmiCategory: '',

        // Step 2: Lifestyle
        activityLevel: '',
        sleepHours: '',
        stressLevel: '',
        isSmoker: false,
        alcoholConsumption: '',

        // Step 3: Diet
        dietType: '',
        sugarIntake: '',
        saltIntake: '',
        eatsLeafyGreens: false,
        eatsFruits: false,
        junkFoodFrequency: '',

        // Step 4: Medical
        allergies: [],
        medicalHistory: [],
        otherConditions: '',
      },

      setStep: (step) => set({ step }),
      
      updateFormData: (newData) => 
        set((state) => ({
          formData: { ...state.formData, ...newData }
        })),

      resetOnboarding: () => set({ 
        step: 1, 
        formData: {
          age: '',
          gender: '',
          height: '',
          weight: '',
          bmi: null,
          bmiCategory: '',
          activityLevel: '',
          sleepHours: '',
          stressLevel: '',
          isSmoker: false,
          alcoholConsumption: '',
          dietType: '',
          sugarIntake: '',
          saltIntake: '',
          eatsLeafyGreens: false,
          eatsFruits: false,
          junkFoodFrequency: '',
          allergies: [],
          medicalHistory: [],
          otherConditions: '',
        }
      }),
    }),
    {
      name: 'vaidyasetu-onboarding-storage', // name of the item in storage (must be unique)
    }
  )
);

export default useOnboardingStore;
