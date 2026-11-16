import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Shield, Check, Lock, Info, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config/api';

const CONSENT_ITEMS = [
  {
    key: 'hospitalCare',
    title: 'Hospital Care Processing',
    desc: 'Core OPD registration, intake, and doctor consultation processing.',
    mandatory: true
  },
  {
    key: 'aiAssistedSummary',
    title: 'AI Assistive Clinical Summary',
    desc: 'Permits AI to draft a 30-second pre-consultation summary for physician review. Can be declined at any time without affecting care.',
    mandatory: false
  },
  {
    key: 'abhaLinkage',
    title: 'Ayushman Bharat ABHA Linkage',
    desc: 'Optionally link your 14-digit ABHA health number for inter-facility portability.',
    mandatory: false
  },
  {
    key: 'abdmRecordSharing',
    title: 'ABDM Federated Record Sharing',
    desc: 'Consent to exchange health records across ABDM-compliant hospitals.',
    mandatory: false
  },
  {
    key: 'documentRetention',
    title: 'Prescription & Report Archival',
    desc: 'Store scanned prescriptions on your longitudinal timeline for future OPD visits.',
    mandatory: false
  },
  {
    key: 'notifications',
    title: 'Real-Time Queue & Token Alerts',
    desc: 'Receive instant notifications when your token is called by the doctor.',
    mandatory: false
  }
];

export default function ConsentSettings() {
  const { user } = useUser();
  const patientId = user?.id || 'guest_patient_001';

  const [decisions, setDecisions] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL.replace('/api', '')}/api/consent/${patientId}`)
      .then(res => {
        if (res.data?.consent?.decisions) {
          setDecisions(res.data.consent.decisions);
        }
      })
      .catch(console.error);
  }, [patientId]);

  const toggleDecision = async (category) => {
    const current = Boolean(decisions[category]);
    const nextVal = !current;
    
    setDecisions(prev => ({ ...prev, [category]: nextVal }));
    setSaving(true);
    try {
      await axios.post(`${API_URL.replace('/api', '')}/api/consent/${patientId}/update`, {
        category,
        decision: nextVal
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-emerald-500 w-7 h-7" />
            Patient Consent & Privacy Center
          </h1>
          <p className="text-sm text-slate-500">
            DPDP Act 2023 & ABDM Health Data Governance compliance
          </p>
        </div>

        {savedMessage && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" /> Preferences Saved
          </span>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 mb-6 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p>
          <strong>Hospital-Local Care Guarantee:</strong> Declining optional features (such as ABHA linkage or AI summaries) will never impede your treatment. Core consultation proceeds without disruption.
        </p>
      </div>

      <div className="space-y-3">
        {CONSENT_ITEMS.map((item) => {
          const isEnabled = item.mandatory ? true : Boolean(decisions[item.key]);

          return (
            <div 
              key={item.key}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  {item.mandatory && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {item.desc}
                </p>
              </div>

              <div>
                {item.mandatory ? (
                  <span className="p-2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => toggleDecision(item.key)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition duration-300 ${
                      isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
