import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Mic, 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  HelpCircle, 
  Heart, 
  Stethoscope, 
  Flame, 
  Wind,
  MapPin
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import InteractiveBodyMap from '../components/InteractiveBodyMap';

const QUICK_SYMPTOMS = [
  { label: 'Chest Pain / Tightness', level: 'high', icon: Heart },
  { label: 'Shortness of Breath', level: 'high', icon: Wind },
  { label: 'Fever & Chills', level: 'medium', icon: Flame },
  { label: 'Severe Headache', level: 'medium', icon: Activity },
  { label: 'Chronic Cough', level: 'low', icon: Stethoscope },
  { label: 'Acid Reflux / Indigestion', level: 'low', icon: Activity },
  { label: 'Joint & Knee Pain', level: 'low', icon: Activity },
  { label: 'General Fatigue', level: 'low', icon: HelpCircle }
];

export default function PatientIntake() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Intake & Red-Flag, 2: Adaptive Questions, 3: Success Token
  const [clinicalMode, setClinicalMode] = useState('modern'); // 'modern' or 'ayush'
  const [complaint, setComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [painAreas, setPainAreas] = useState([]);
  const [vitals, setVitals] = useState({ bpSystolic: '', bpDiastolic: '', heartRate: '', spO2: '', temperature: '' });
  
  // Triage state
  const [evaluating, setEvaluating] = useState(false);
  const [encounterId, setEncounterId] = useState(null);
  const [redFlags, setRedFlags] = useState([]);
  const [priority, setPriority] = useState('routine');
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [tokenResult, setTokenResult] = useState(null);

  // Voice recording simulation
  const [listening, setListening] = useState(false);

  const toggleSymptom = (label) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const handleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported on this browser. Please type your symptoms.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setComplaint(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.start();
  };

  // Step 1 Submit: Starts Encounter & Runs Rule Engine First
  const handleStartIntake = async (e) => {
    e.preventDefault();
    if (!complaint && selectedSymptoms.length === 0 && painAreas.length === 0) {
      alert('Please describe your complaint, select symptoms, or tap a location on the Body Map.');
      return;
    }

    setEvaluating(true);
    try {
      const allSymptoms = [
        ...selectedSymptoms.map(s => ({ text: s, method: 'quickcard' })),
        ...painAreas.map(p => ({ text: `${p.label} (${p.intensity} - ${p.quality})`, method: 'bodymap', bodyLocation: p.id }))
      ];
      const activeComplaint = complaint || selectedSymptoms.join(', ') || (painAreas.length > 0 ? `Pain localized in ${painAreas.map(p => p.label).join(', ')}` : 'General checkup');
      
      const res = await axios.post(`${API_URL.replace('/api', '')}/api/intake/start`, {
        patientId: user?.id || 'guest_patient_001',
        patientName: user?.fullName || 'Patient',
        complaint: activeComplaint,
        symptoms: allSymptoms,
        painAreas,
        vitals: {
          bpSystolic: Number(vitals.bpSystolic) || undefined,
          bpDiastolic: Number(vitals.bpDiastolic) || undefined,
          heartRate: Number(vitals.heartRate) || undefined,
          spO2: Number(vitals.spO2) || undefined,
          temperature: Number(vitals.temperature) || undefined
        },
        clinicalMode
      });

      if (res.data?.success) {
        setEncounterId(res.data.encounterId);
        setPriority(res.data.triagePriority);
        setRedFlags(res.data.redFlags || []);
        setAdaptiveQuestions(res.data.adaptiveQuestions || []);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Error initiating clinical intake: ' + (err.response?.data?.error || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  // Step 2 Submit: Saves Adaptive Answers & Issues Real-time Token
  const handleFinalizeQuestions = async () => {
    setEvaluating(true);
    try {
      // 1. Submit answers
      const answersPayload = Object.keys(answers).map(qId => {
        const qObj = adaptiveQuestions.find(q => q.id === qId);
        return {
          questionId: qId,
          question: qObj?.text || '',
          answer: answers[qId]
        };
      });

      if (answersPayload.length > 0) {
        await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/answers`, {
          answers: answersPayload
        });
      }

      // 2. Issue Queue Token
      const tokenRes = await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/finalize-token`);
      if (tokenRes.data?.success) {
        setTokenResult(tokenRes.data);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to issue token: ' + (err.response?.data?.error || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Stepper Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500 w-7 h-7" />
            MediKiosk First-Mile Clinical Intake
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-assisted, rule-verified pre-consultation OPD registration
          </p>
        </div>

        {/* Clinical Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setClinicalMode('modern')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              clinicalMode === 'modern'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Allopathic (Modern)
          </button>
          <button
            onClick={() => setClinicalMode('ayush')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              clinicalMode === 'ayush'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            AYUSH / Ayurveda
          </button>
        </div>
      </div>

      {/* STEP 1: Symptom Capture & Red-Flag Screening */}
      {step === 1 && (
        <form onSubmit={handleStartIntake} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              1. What primary discomfort brings you to the hospital today?
            </h2>
            <div className="relative">
              <textarea
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="E.g., Severe pressure in chest since morning, accompanied by sweating..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleSpeechInput}
                className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
                title="Speak in English/Hindi"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Symptom Chips */}
            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block tracking-wider">
                Or Tap Common Presentations:
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_SYMPTOMS.map((qs) => {
                  const active = selectedSymptoms.includes(qs.label);
                  return (
                    <button
                      type="button"
                      key={qs.label}
                      onClick={() => toggleSymptom(qs.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      <qs.icon className="w-3.5 h-3.5" />
                      {qs.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1.5 Interactive Anatomical Body Map */}
          <div>
            <InteractiveBodyMap
              initialAreas={painAreas}
              onPainAreasChange={(areas, summaryText) => {
                setPainAreas(areas);
                if (summaryText) {
                  setComplaint(prev => {
                    const cleanPrev = prev.replace(/\n\n\[Body Map Pain\]:.*$/s, '').trim();
                    return cleanPrev ? `${cleanPrev}\n\n[Body Map Pain]: ${summaryText}` : `[Body Map Pain]: ${summaryText}`;
                  });

                  // Automatically correlate high-risk presentation cards
                  areas.forEach(a => {
                    if (a.redFlagKey === 'chest' && !selectedSymptoms.includes('Chest Pain / Tightness')) {
                      setSelectedSymptoms(prev => [...prev, 'Chest Pain / Tightness']);
                    }
                    if (a.redFlagKey === 'head' && a.intensity === 'severe' && !selectedSymptoms.includes('Severe Headache')) {
                      setSelectedSymptoms(prev => [...prev, 'Severe Headache']);
                    }
                  });
                }
              }}
            />
          </div>

          {/* Vitals Entry (Optional Kiosk Readings) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              2. Kiosk Vitals (Optional / Auto-device capture)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Systolic BP</label>
                <input
                  type="number"
                  placeholder="120"
                  value={vitals.bpSystolic}
                  onChange={e => setVitals({...vitals, bpSystolic: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Diastolic BP</label>
                <input
                  type="number"
                  placeholder="80"
                  value={vitals.bpDiastolic}
                  onChange={e => setVitals({...vitals, bpDiastolic: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  placeholder="98"
                  value={vitals.spO2}
                  onChange={e => setVitals({...vitals, spO2: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Heart Rate</label>
                <input
                  type="number"
                  placeholder="75"
                  value={vitals.heartRate}
                  onChange={e => setVitals({...vitals, heartRate: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Temp (°F)</label>
                <input
                  type="number"
                  placeholder="98.6"
                  value={vitals.temperature}
                  onChange={e => setVitals({...vitals, temperature: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={evaluating}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                Evaluating Clinical Rules & Red Flags...
              </>
            ) : (
              <>
                Perform Clinical Triage & Next Step
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Red-Flag Alert (if any) + 4-5 Adaptive Questions */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Emergency / Urgent Banner if matched */}
          {priority === 'emergency' && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-500 rounded-2xl p-6 text-red-900 dark:text-red-200">
              <div className="flex items-center gap-3 font-bold text-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
                CRITICAL RED-FLAG DETECTED: Priority Escalation
              </div>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                The clinician-approved safety rule engine has flagged time-sensitive emergency indicators:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                {redFlags.map((rf, i) => (
                  <li key={i}><strong>{rf.ruleId}:</strong> {rf.description} <em>({rf.guideline})</em></li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-xs font-semibold text-red-800 dark:text-red-200">
                ⚠️ This encounter will be routed straight to Priority / Red-Flag Queue for immediate human verification.
              </div>
            </div>
          )}

          {/* Adaptive Questions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Adaptive Clinical Follow-Up ({clinicalMode.toUpperCase()} Mode)
              </h2>
              <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-medium">
                {adaptiveQuestions.length} Questions Missing
              </span>
            </div>

            <div className="space-y-6">
              {adaptiveQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    {idx + 1}. {q.text}
                  </p>
                  
                  {/* Choice Buttons */}
                  {q.type === 'choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={`p-2.5 text-left text-xs rounded-lg border transition ${
                            answers[q.id] === opt
                              ? 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Scale 1-10 */}
                  {q.type === 'scale' && (
                    <div className="flex items-center gap-2 mt-2">
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setAnswers({ ...answers, [q.id]: String(num) })}
                          className={`w-9 h-9 rounded-lg text-xs font-bold border transition ${
                            answers[q.id] === String(num)
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Free text */}
                  {q.type === 'text' && (
                    <input
                      type="text"
                      placeholder="Type brief details..."
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm"
            >
              Back
            </button>
            <button
              onClick={handleFinalizeQuestions}
              disabled={evaluating}
              className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {evaluating ? 'Issuing Token & Live Queue Registration...' : 'Complete Intake & Generate Live Token'}
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Live Token Generated */}
      {step === 3 && tokenResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              tokenResult.priority === 'emergency' 
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              Priority: {tokenResult.priority}
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {tokenResult.tokenNumber}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your consultation token has been broadcasted to the doctor's queue.
            </p>
          </div>

          {/* QR Code Presentation */}
          {tokenResult.qrCode && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 inline-block rounded-2xl border border-slate-200 dark:border-slate-700">
              <img src={tokenResult.qrCode} alt="OPD Token QR" className="w-48 h-48 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-mono">Scan at Doctor Desk / Kiosk</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <p className="text-xs text-slate-400">Current Queue Position</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                #{tokenResult.position}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <p className="text-xs text-slate-400">Estimated Wait</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ~{tokenResult.estimatedWaitMinutes} mins
              </p>
            </div>
          </div>

          <div className="flex gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={() => navigate('/waiting')}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
            >
              Open Live Waiting Screen →
            </button>
            <button
              onClick={() => { setStep(1); setComplaint(''); setSelectedSymptoms([]); }}
              className="px-5 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm"
            >
              New Intake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
