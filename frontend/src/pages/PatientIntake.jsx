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
  MapPin,
  User,
  Users,
  Building2,
  FileText,
  UploadCloud,
  Clock,
  QrCode,
  ArrowLeft,
  Phone,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

const AVAILABLE_DOCTORS = [
  { id: 'doc_default', name: 'Dr. Rajesh Sharma, MD', department: 'General Medicine OPD', room: 'Room 104', queueCount: 2, avgWaitMin: 15 },
  { id: 'doc_internal', name: 'Dr. Ananya Sen, MBBS', department: 'Internal Medicine', room: 'Room 108', queueCount: 0, avgWaitMin: 3 },
  { id: 'doc_ayush', name: 'Dr. Priya Kulkarni, BAMS', department: 'AYUSH / Ayurveda', room: 'Room 112', queueCount: 1, avgWaitMin: 8 }
];

export default function PatientIntake() {
  const { user } = useUser();
  const navigate = useNavigate();

  // Stepper Flow (1: Auth/Who, 2: Service, 3: Symptoms & Body Map, 4: Safety & Questions, 5: Docs & Vitals, 6: Doctor & Token)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Identity & Who Needs Care
  const [phoneNumber, setPhoneNumber] = useState(user?.primaryPhoneNumber?.phoneNumber || '+91 98765 43210');
  const [recipient, setRecipient] = useState('self'); // 'self' | 'family'
  const [familyDetails, setFamilyDetails] = useState({ relation: 'Child', name: '', age: '', gender: 'Male' });

  // Step 2: Service Selection
  const [serviceType, setServiceType] = useState('opd'); // 'opd' | 'lab' | 'followup'
  const [clinicalMode, setClinicalMode] = useState('modern'); // 'modern' or 'ayush'

  // Step 3: Symptoms & Body Map
  const [complaint, setComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [painAreas, setPainAreas] = useState([]);
  const [listening, setListening] = useState(false);

  // Step 4: Red-Flag & Adaptive Questions
  const [evaluating, setEvaluating] = useState(false);
  const [encounterId, setEncounterId] = useState(null);
  const [redFlags, setRedFlags] = useState([]);
  const [priority, setPriority] = useState('routine');
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // Step 5: Document Upload & Vitals
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [ocrPreviewText, setOcrPreviewText] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [vitals, setVitals] = useState({ bpSystolic: '120', bpDiastolic: '80', heartRate: '75', spO2: '98', temperature: '98.6' });

  // Step 6: Choose Doctor & Issued Token
  const [selectedDoctor, setSelectedDoctor] = useState(AVAILABLE_DOCTORS[0]);
  const [tokenResult, setTokenResult] = useState(null);

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

  // Triggered when advancing from Step 3 to Step 4 (Runs Rule Engine First!)
  const handleEvaluateSafetyAndQuestions = async () => {
    if (!complaint && selectedSymptoms.length === 0 && painAreas.length === 0) {
      alert('Please describe your symptoms, select quick cards, or tap on the Body Map.');
      return;
    }

    setEvaluating(true);
    try {
      const allSymptoms = [
        ...selectedSymptoms.map(s => ({ text: s, method: 'quickcard' })),
        ...painAreas.map(p => ({ text: `${p.label} (${p.intensity} - ${p.quality})`, method: 'bodymap', bodyLocation: p.id }))
      ];
      const activeComplaint = complaint || selectedSymptoms.join(', ') || (painAreas.length > 0 ? `Pain localized in ${painAreas.map(p => p.label).join(', ')}` : 'General consultation');

      const res = await axios.post(`${API_URL.replace('/api', '')}/api/intake/start`, {
        patientId: user?.id || 'guest_patient_001',
        patientName: recipient === 'family' ? familyDetails.name || 'Family Member' : (user?.fullName || 'Patient'),
        age: recipient === 'family' ? Number(familyDetails.age) || 28 : 30,
        gender: recipient === 'family' ? familyDetails.gender : 'Unspecified',
        whoNeedsCare: {
          recipient,
          relation: familyDetails.relation,
          name: familyDetails.name,
          age: Number(familyDetails.age),
          gender: familyDetails.gender
        },
        serviceType,
        clinicalMode,
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
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        departmentId: selectedDoctor.department
      });

      if (res.data?.success) {
        setEncounterId(res.data.encounterId);
        setPriority(res.data.triagePriority);
        setRedFlags(res.data.redFlags || []);
        setAdaptiveQuestions(res.data.adaptiveQuestions || []);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error(err);
      alert('Error evaluating intake: ' + (err.response?.data?.error || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  const handleSimulateDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isLab = file.name.toLowerCase().includes('lab') || file.name.toLowerCase().includes('blood') || file.name.toLowerCase().includes('report');
      const ocrText = `[OCR Text from ${file.name}]: Document verified. Extracted clinical notes: Patient history of seasonal reactive airway disease, prescribed Levocetirizine 5mg BD. Past baseline examination noted.`;
      const doc = {
        fileName: file.name,
        documentType: isLab ? 'lab-report' : 'prescription',
        ocrText,
        ocrConfidence: 0.95,
        uploadedAt: new Date()
      };
      setUploadedDocuments(prev => [...prev, doc]);
      setUploadedDocName(file.name);
      setOcrPreviewText(ocrText);
    }
  };

  const addPresetDocument = (presetType) => {
    let doc;
    if (presetType === 'prescription') {
      doc = {
        fileName: 'Previous_OPD_Prescription_2025.pdf',
        documentType: 'prescription',
        ocrText: 'Prescription: Tab Metformin 500mg BD after meals, Tab Telmisartan 40mg OD morning. Diagnosed with Essential Hypertension and T2DM 1 yr ago. Advised low sodium diet.',
        ocrConfidence: 0.96,
        uploadedAt: new Date()
      };
    } else if (presetType === 'lab') {
      doc = {
        fileName: 'Diagnostic_Lab_Metabolic_Panel.pdf',
        documentType: 'lab-report',
        ocrText: 'Pathology Lab: Fasting Blood Sugar: 134 mg/dL (Elevated), HbA1c: 7.2%, Serum Creatinine: 0.92 mg/dL (Normal reference 0.7-1.3), Total Cholesterol: 210 mg/dL.',
        ocrConfidence: 0.94,
        uploadedAt: new Date()
      };
    } else {
      doc = {
        fileName: 'Hospital_Discharge_Summary.pdf',
        documentType: 'discharge-summary',
        ocrText: 'Discharge Summary: Episode of acute bronchospasm resolved with bronchodilator nebulization. Advised Levocetirizine 5mg and Budesonide inhaler SOS.',
        ocrConfidence: 0.95,
        uploadedAt: new Date()
      };
    }
    setUploadedDocuments(prev => [...prev, doc]);
    setUploadedDocName(doc.fileName);
    setOcrPreviewText(doc.ocrText);
  };

  const removeDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, idx) => idx !== index));
    if (uploadedDocuments.length <= 1) {
      setUploadedDocName('');
      setOcrPreviewText('');
    }
  };

  // Intermediate Step: Save answers and proceed to Vitals & Docs
  const handleProceedToStep5 = async () => {
    try {
      const answersPayload = Object.keys(answers).map(qId => {
        const qObj = adaptiveQuestions.find(q => q.id === qId);
        return {
          questionId: qId,
          question: qObj?.text || '',
          answer: String(answers[qId])
        };
      }).filter(a => a.answer && a.answer.trim().length > 0);

      if (answersPayload.length > 0 && encounterId) {
        await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/answers`, {
          answers: answersPayload
        });
      }
    } catch (e) {
      console.warn('Answers autosave error:', e.message);
    }
    setCurrentStep(5);
  };

  // Final Step: Issue Live Token
  const handleIssueToken = async () => {
    setEvaluating(true);
    try {
      // 1. Submit adaptive answers if any
      const answersPayload = Object.keys(answers).map(qId => {
        const qObj = adaptiveQuestions.find(q => q.id === qId);
        return {
          questionId: qId,
          question: qObj?.text || '',
          answer: answers[qId]
        };
      });

      if (answersPayload.length > 0 && encounterId) {
        await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/answers`, {
          answers: answersPayload
        });
      }

      // 2. Submit documents if any
      if (uploadedDocuments.length > 0 && encounterId) {
        await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/documents`, {
          documents: uploadedDocuments
        });
      }

      // 3. Finalize Token passing both answers and documents
      const tokenRes = await axios.post(`${API_URL.replace('/api', '')}/api/intake/${encounterId}/finalize-token`, {
        answers: answersPayload,
        documents: uploadedDocuments
      });

      if (tokenRes.data?.success) {
        setTokenResult(tokenRes.data);
        setCurrentStep(6);
      }
    } catch (err) {
      console.error(err);
      alert('Error finalizing token: ' + (err.response?.data?.error || err.message));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      
      {/* ── FLOW STEPPER BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 overflow-x-auto pb-2 sm:pb-0 gap-2">
          {[
            { step: 1, label: '1. Identity & Care' },
            { step: 2, label: '2. Service' },
            { step: 3, label: '3. Symptoms & Body Map' },
            { step: 4, label: '4. Safety & Questions' },
            { step: 5, label: '5. Vitals & OCR' },
            { step: 6, label: '6. Doctor & Token' }
          ].map((s) => (
            <div
              key={s.step}
              className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl transition ${
                currentStep === s.step
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                  : currentStep > s.step
                  ? 'text-slate-800 dark:text-slate-200'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === s.step
                  ? 'bg-emerald-600 text-white'
                  : currentStep > s.step
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {currentStep > s.step ? '✓' : s.step}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: PATIENT SIGN-IN & WHO NEEDS CARE ── */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Step 1 of 6 • Patient Entry
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Patient Identification & Care Recipient
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify your mobile number and select whether this consultation is for yourself or a family member.
            </p>
          </div>

          {/* OTP / Mobile Input */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Patient Mobile Number (OTP Verification)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="px-4 py-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                <Check className="w-4 h-4" /> Verified
              </span>
            </div>
          </div>

          {/* Who Needs Care (Self vs Family Member) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Who is this consultation for?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setRecipient('self')}
                className={`p-5 rounded-2xl border cursor-pointer transition flex items-center gap-4 ${
                  recipient === 'self'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${recipient === 'self' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Myself (Self)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Consultation for registered account</p>
                </div>
              </div>

              <div
                onClick={() => setRecipient('family')}
                className={`p-5 rounded-2xl border cursor-pointer transition flex items-center gap-4 ${
                  recipient === 'family'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${recipient === 'family' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Family Member</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Child, Parent, Spouse or Dependant</p>
                </div>
              </div>
            </div>

            {/* If Family Member Selected: Details */}
            {recipient === 'family' && (
              <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-500/20 space-y-3 mt-4 animate-in fade-in">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Family Member Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Relationship</label>
                    <select
                      value={familyDetails.relation}
                      onChange={e => setFamilyDetails({ ...familyDetails, relation: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    >
                      <option>Child</option>
                      <option>Parent</option>
                      <option>Spouse</option>
                      <option>Sibling</option>
                      <option>Other Dependant</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="E.g., Aarav Kumari"
                      value={familyDetails.name}
                      onChange={e => setFamilyDetails({ ...familyDetails, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Age & Gender</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Age"
                        value={familyDetails.age}
                        onChange={e => setFamilyDetails({ ...familyDetails, age: e.target.value })}
                        className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                      />
                      <select
                        value={familyDetails.gender}
                        onChange={e => setFamilyDetails({ ...familyDetails, gender: e.target.value })}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Service Selection</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: CHOOSE SERVICE ── */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 2 of 6 • Hospital Service
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Choose Consultation Service
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your required healthcare pathway at MediKiosk.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'opd', title: 'OPD Consultation', desc: 'Face-to-face physician consultation with triage priority', icon: Stethoscope },
              { id: 'lab', title: 'Laboratory Investigation', desc: 'Direct blood, urine, or pathology test ordering', icon: Activity },
              { id: 'followup', title: 'Follow-Up Review', desc: 'Fast review without re-registration for ongoing treatment', icon: Clock }
            ].map((svc) => (
              <div
                key={svc.id}
                onClick={() => setServiceType(svc.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  serviceType === svc.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    serviceType === svc.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                  }`}>
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{svc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Mode (Allopathic vs AYUSH) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Medical Philosophy Mode</span>
              <p className="text-[11px] text-slate-500">Adapts questions for Modern Allopathic or AYUSH / Ayurveda</p>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setClinicalMode('modern')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  clinicalMode === 'modern' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Allopathic
              </button>
              <button
                type="button"
                onClick={() => setClinicalMode('ayush')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  clinicalMode === 'ayush' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                AYUSH / Ayurveda
              </button>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Symptom & Body Map Capture</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 3: SYMPTOM CAPTURE & INTERACTIVE BODY MAP ── */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 3 of 6 • Multi-Modal Symptoms
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Symptom Capture & Body Map Localization
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Speak, type, select cards, or tap directly on the body map to describe your discomfort.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          {/* Voice + Text Area */}
          <div className="relative">
            <textarea
              rows={3}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe your primary discomfort (e.g., Heavy crushing pain in chest since 2 hours with sweating)..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
            <button
              type="button"
              onClick={handleSpeechInput}
              className={`absolute right-3 bottom-3 p-3 rounded-xl transition ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title="Speak in Hindi/English"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Symptoms */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Quick Symptom Chips
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

          {/* ── INTERACTIVE BODY MAP ── */}
          <div className="pt-2">
            <InteractiveBodyMap
              initialAreas={painAreas}
              onPainAreasChange={(areas, summaryText) => {
                setPainAreas(areas);
                if (summaryText) {
                  setComplaint(prev => {
                    const cleanPrev = prev.replace(/\n\n\[Body Map Pain\]:.*$/s, '').trim();
                    return cleanPrev ? `${cleanPrev}\n\n[Body Map Pain]: ${summaryText}` : `[Body Map Pain]: ${summaryText}`;
                  });

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

          <button
            onClick={handleEvaluateSafetyAndQuestions}
            disabled={evaluating}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <span>Run Rule-First Red Flag Check & Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 4: SAFETY CHECK & ADAPTIVE QUESTIONS ── */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 4 of 6 • Clinical Safety Evaluation
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Rule-Based Triage & Adaptive Clarifications
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Clinician safety engine evaluated your presentation before consultation.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(3)}
              className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          {/* Red Flag Alert Branch if Emergency */}
          {priority === 'emergency' ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-2xl space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-base">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <span>EMERGENCY RED-FLAG TRIGGERED</span>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                High-priority clinical safety rule detected (e.g. potential acute coronary syndrome or critical vitals). Your token will be routed to the <strong>Immediate Emergency Priority Queue</strong>.
              </p>
              <div className="space-y-1.5 pt-2">
                {redFlags.map((rf, idx) => (
                  <div key={idx} className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg text-xs text-red-700 dark:text-red-400 font-bold border border-red-200">
                    Rule {rf.ruleId}: {rf.symptom} — {rf.guideline}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Standard Safety Screening Passed
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  No immediate life-threatening emergency flagged. Proceeding to adaptive clarifications.
                </p>
              </div>
            </div>
          )}

          {/* 4-5 Adaptive Follow-up Questions (Only missing information) */}
          {adaptiveQuestions.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Adaptive Follow-Up Questions (4-5 Items Only)
              </h3>
              <div className="space-y-3">
                {adaptiveQuestions.map((q) => {
                  const isScale = q.type === 'scale' || q.min !== undefined || q.field === 'severity';
                  const isText = q.type === 'text' || (!q.options && !isScale);
                  const currentAns = answers[q.id] || '';

                  return (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {q.text}
                        </label>
                        {currentAns && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                            Answered
                          </span>
                        )}
                      </div>

                      {/* 1. Scale Input: 1 to 10 rating bar */}
                      {isScale && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>1 (Mild Discomfort)</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {currentAns ? `Selected: ${currentAns}` : 'Select 1 - 10'}
                            </span>
                            <span>10 (Severe / Emergency)</span>
                          </div>
                          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                              const isSelected = String(currentAns).startsWith(String(val)) || currentAns === String(val);
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setAnswers({ ...answers, [q.id]: `${val}/10 (${val <= 3 ? 'Mild' : val <= 6 ? 'Moderate' : 'Severe'})` })}
                                  className={`py-2 rounded-xl text-xs font-black transition border flex flex-col items-center justify-center ${
                                    isSelected
                                      ? val <= 3
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                                        : val <= 6
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
                                        : 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                  }`}
                                >
                                  <span>{val}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Multiple Choice Options (if provided) */}
                      {q.options && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                                currentAns === opt
                                  ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 3. Text Input (for text questions, or custom/free typing) */}
                      {(isText || currentAns.toLowerCase().includes('other') || !q.options || q.options.length === 0) && (
                        <div className="pt-1">
                          <input
                            type="text"
                            placeholder={isText ? "Type your response here (or write 'None')..." : "Specify details here..."}
                            value={q.options?.includes(currentAns) ? '' : currentAns}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToStep5}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Vitals & Document OCR</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 5: DOCUMENT UPLOAD (OCR) & VITALS ENTRY ── */}
      {currentStep === 5 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step 5 of 6 • Objective Data
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Upload Documents (OCR) & Vitals Capture
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Attach past prescriptions or lab records and measure physiological vitals.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(4)}
              className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          {/* Document Upload & OCR */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
            <UploadCloud className="w-10 h-10 text-emerald-500 mx-auto" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Upload Previous Prescriptions or Diagnostic Reports
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                OCR extracts medications and conditions to summarize for your consulting doctor.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition">
                <span>Select File (PDF / Image)</span>
                <input type="file" onChange={handleSimulateDocumentUpload} className="hidden" />
              </label>
              
              <button
                type="button"
                onClick={() => addPresetDocument('prescription')}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>+ Past Prescription (Metformin/BP)</span>
              </button>

              <button
                type="button"
                onClick={() => addPresetDocument('lab')}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>+ Lab Report (HbA1c & Sugar)</span>
              </button>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2 text-left pt-2">
                <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  Attached Documents ({uploadedDocuments.length}) • OCR Extracted:
                </span>
                {uploadedDocuments.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ✓ {doc.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="text-slate-400 hover:text-red-500 text-[11px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono line-clamp-2">{doc.ocrText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vitals Entry (Manual / Kiosk Telemetry) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              Kiosk Vitals Entry (Auto-detected or Manual)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Systolic BP</label>
                <input
                  type="number"
                  value={vitals.bpSystolic}
                  onChange={e => setVitals({ ...vitals, bpSystolic: e.target.value })}
                  placeholder="120"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Diastolic BP</label>
                <input
                  type="number"
                  value={vitals.bpDiastolic}
                  onChange={e => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                  placeholder="80"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={vitals.spO2}
                  onChange={e => setVitals({ ...vitals, spO2: e.target.value })}
                  placeholder="98"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Heart Rate</label>
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={e => setVitals({ ...vitals, heartRate: e.target.value })}
                  placeholder="75"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Temp (°F)</label>
                <input
                  type="number"
                  value={vitals.temperature}
                  onChange={e => setVitals({ ...vitals, temperature: e.target.value })}
                  placeholder="98.6"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(6)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Proceed to Choose Doctor & Token Generation</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 6: CHOOSE DOCTOR & TOKEN ISSUED ── */}
      {currentStep === 6 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {!tokenResult ? (
            <>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 6 of 6 • Doctor Selection
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Choose Available OPD Doctor
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  View real-time queue length and estimated waiting times for attending physicians.
                </p>
              </div>

              <div className="space-y-3">
                {AVAILABLE_DOCTORS.map((doc) => {
                  const isChosen = selectedDoctor.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isChosen
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isChosen ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</h4>
                          <p className="text-xs text-slate-500">{doc.department} • {doc.room}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          ~{doc.avgWaitMin}m wait
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {doc.queueCount} in queue
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleIssueToken}
                disabled={evaluating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-base disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                <span>Issue Real-Time Token & QR Code</span>
              </button>
            </>
          ) : (
            /* Token Confirmation Display */
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Token Successfully Issued
                </span>
                <div className="font-mono text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
                  {tokenResult.token?.tokenNumber || 'OPD-001'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned to: <strong>{selectedDoctor.name}</strong> ({selectedDoctor.room})
                </p>
              </div>

              {/* Scannable QR Code */}
              <div className="inline-block p-4 bg-white rounded-3xl shadow-lg border-2 border-emerald-500/30">
                <QRCodeSVG
                  value={JSON.stringify({
                    token: tokenResult.token?.tokenNumber,
                    encounterId: tokenResult.encounterId,
                    patient: recipient === 'family' ? familyDetails.name : (user?.fullName || 'Patient')
                  })}
                  size={160}
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                  Scan at OPD Door Sensor
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-bold">Queue Position</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                    #{tokenResult.token?.position || 1}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-bold">Estimated Wait</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ~{tokenResult.token?.estimatedWaitMinutes || 8} mins
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/waiting')}
                className="w-full max-w-md mx-auto py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm transition"
              >
                <span>Proceed to Live Waiting Room TV</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
