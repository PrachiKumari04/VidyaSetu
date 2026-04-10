import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import CreatableSelect from 'react-select/creatable';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronLeft, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';

const ALLERGY_OPTIONS = [
  { value: 'Dust Mites', label: 'Dust Mites' },
  { value: 'Pollen (Parthenium)', label: 'Pollen (Parthenium)' },
  { value: 'Peanuts', label: 'Peanuts' },
  { value: 'Dairy (Lactose)', label: 'Dairy (Lactose)' },
  { value: 'Shellfish', label: 'Shellfish' },
  { value: 'Soy', label: 'Soy' },
  { value: 'Wheat (Gluten)', label: 'Wheat (Gluten)' },
  { value: 'Egg', label: 'Egg' },
  { value: 'Sulfa Drugs', label: 'Sulfa Drugs' },
  { value: 'Penicillin', label: 'Penicillin' },
  { value: 'Latex', label: 'Latex' },
  { value: 'Cockroaches', label: 'Cockroaches' },
  { value: 'Mold', label: 'Mold' },
  { value: 'Pet Dander', label: 'Pet Dander' },
  { value: 'Brinjal', label: 'Brinjal' },
  { value: 'Mustard', label: 'Mustard' },
  { value: 'Cashews', label: 'Cashews' },
  { value: 'Walnuts', label: 'Walnuts' },
  { value: 'Red Meat', label: 'Red Meat' },
  { value: 'Fragrances', label: 'Fragrances' },
];

const CONDITION_OPTIONS = [
  'Type 2 Diabetes', 'Hypertension', 'Thyroid Disorders', 
  'Asthma', 'Heart Disease', 'PCOS', 'Anemia'
];

const Step4History = () => {
  const { user } = useUser();
  const { formData, updateFormData, setStep, resetOnboarding } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAllergyChange = (newValue) => {
    updateFormData({ allergies: newValue ? newValue.map(v => v.value) : [] });
  };

  const toggleCondition = (condition) => {
    const current = formData.medicalHistory;
    if (current.includes(condition)) {
      updateFormData({ medicalHistory: current.filter(c => c !== condition) });
    } else {
      updateFormData({ medicalHistory: [...current, condition] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        clerkId: user.id,
      };
      
      const response = await axios.post('http://localhost:5000/api/user/profile', payload);
      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          // In a real app, redirect to dashboard
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('Final submission failed:', error);
      alert('Failed to activate ecosystem. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-500">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Ecosystem Activated</h2>
        <p className="text-gray-400 text-center">Redirecting you to your health bridge...</p>
      </div>
    );
  }

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#030712',
      borderColor: state.isFocused ? '#10b981' : '#1f2937',
      borderRadius: '0.75rem',
      padding: '4px',
      color: 'white',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#374151'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '0.75rem',
      overflow: 'hidden'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#059669' : 'transparent',
      color: state.isFocused ? 'white' : '#9ca3af',
      '&:active': {
        backgroundColor: '#10b981'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#10b981',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#10b981',
      '&:hover': {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        color: '#34d399'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'white'
    })
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-4 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-emerald-500" />
          Allergies (Select or Type new)
        </label>
        <CreatableSelect
          isMulti
          options={ALLERGY_OPTIONS}
          value={formData.allergies.map(a => ({ value: a, label: a }))}
          onChange={handleAllergyChange}
          placeholder="Search e.g. Penicillin, Peanuts..."
          styles={selectStyles}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* Medical History */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-4">
          Pre-existing Conditions
        </label>
        <div className="flex flex-wrap gap-3">
          {CONDITION_OPTIONS.map((condition) => {
            const isSelected = formData.medicalHistory.includes(condition);
            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleCondition(condition)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </div>

      {/* Other */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Other Conditions or Observations
        </label>
        <textarea
          value={formData.otherConditions}
          onChange={(e) => updateFormData({ otherConditions: e.target.value })}
          rows={3}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
          placeholder="Type any other health details here..."
        />
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setStep(3)}
          className="flex-1 py-4 bg-gray-950 border border-gray-800 text-gray-400 font-bold rounded-xl hover:bg-gray-900 transition-all flex items-center justify-center group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/20 border border-emerald-400/20"
        >
          {loading ? 'Initializing...' : 'Activate Ecosystem'}
          <Check className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Step4History;
