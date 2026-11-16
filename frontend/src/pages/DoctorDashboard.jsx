import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  Stethoscope,
  Activity,
  Edit3,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Heart,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  User,
  Volume2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function DoctorDashboard() {
  const doctorId = 'doc_default';
  const [queue, setQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Consultation state
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [labInstructions, setLabInstructions] = useState('');
  const [followUpWindow, setFollowUpWindow] = useState('none');

  const COMMON_LAB_TESTS = [
    'Complete Blood Count (CBC)',
    'Fasting Blood Glucose (FBS)',
    'Lipid Profile (Cholesterol/Triglycerides)',
    'Liver Function Test (LFT)',
    'Kidney Function Test (KFT / Creatinine)',
    'Urine Routine & Microscopic',
    'Thyroid Profile (TSH, T3, T4)',
    'Serum Electrolytes (Na/K/Cl)'
  ];

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${API_URL.replace('/api', '')}/api/queue/doctor/${doctorId}`);
      if (res.data?.success) {
        setQueue(res.data.queue || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientSummary = async (encounterId, regenerate = false) => {
    try {
      const url = `${API_URL.replace('/api', '')}/api/summary/${encounterId}${regenerate ? '?regenerate=true' : ''}`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setSummaryData(res.data.summary);
        setActiveEncounter(res.data.encounter);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Socket.io Real-time connection
    const socket = io(API_URL.replace('/api', ''), { transports: ['websocket'] });
    socket.emit('join:doctor', doctorId);

    socket.on('queue:updated', () => {
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const playCallChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio not permitted without user gesture
    }
  };

  const handleCallNext = async () => {
    setCalling(true);
    playCallChime();
    try {
      const res = await axios.post(`${API_URL.replace('/api', '')}/api/queue/doctor/${doctorId}/call-next`);
      if (res.data?.success && res.data.calledToken) {
        setActivePatient(res.data.calledToken);
        loadPatientSummary(res.data.calledToken.encounterId);
        fetchQueue();
      } else {
        alert(res.data?.message || 'No patients waiting in queue.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalling(false);
    }
  };

  const handleVerifySummary = async (action) => {
    if (!activePatient) return;
    setVerifying(true);
    try {
      await axios.post(`${API_URL.replace('/api', '')}/api/summary/${activePatient.encounterId}/verify`, {
        action,
        doctorId
      });
      alert(`AI clinical draft marked as ${action.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!activePatient) return;
    try {
      const labOrdersPayload = selectedLabTests.map(testName => ({
        testName,
        instructions: labInstructions || 'Standard Hospital Protocol',
        status: 'ordered'
      }));

      let followUpPayload = { required: false };
      if (followUpWindow !== 'none') {
        const daysMap = { '3_days': 3, '1_week': 7, '2_weeks': 14, '1_month': 30 };
        const followDate = new Date();
        followDate.setDate(followDate.getDate() + (daysMap[followUpWindow] || 7));
        followUpPayload = {
          required: true,
          date: followDate,
          window: followUpWindow.replace('_', ' ')
        };
      }

      await axios.post(`${API_URL.replace('/api', '')}/api/encounters/${activePatient.encounterId}/complete`, {
        diagnosis,
        advice,
        prescription: { notes: prescription },
        labOrders: labOrdersPayload,
        followUp: followUpPayload
      });

      let alertMsg = 'Consultation concluded & stored to longitudinal encounter record!';
      if (labOrdersPayload.length > 0) {
        alertMsg += `\n🧪 ${labOrdersPayload.length} Lab Test(s) ordered & routed to Pathology Lab.`;
      }
      if (followUpPayload.required) {
        alertMsg += `\n📋 Auto Follow-Up scheduled for ${followUpPayload.date.toLocaleDateString()} (No re-registration required).`;
      }
      alert(alertMsg);

      setActivePatient(null);
      setSummaryData(null);
      setActiveEncounter(null);
      setDiagnosis('');
      setPrescription('');
      setAdvice('');
      setSelectedLabTests([]);
      setLabInstructions('');
      setFollowUpWindow('none');
      fetchQueue();
    } catch (err) {
      console.error(err);
      alert('Error finalizing consultation: ' + (err.response?.data?.error || err.message));
    }
  };

  const emergencies = queue.filter(t => t.priority === 'emergency');
  const routine = queue.filter(t => t.priority !== 'emergency');

  const painAreas = activeEncounter?.painAreas || [];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      
      {/* ── DOCTOR COCKPIT TOP ANNOUNCEMENT BANNER ── */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-500/30 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                MediKiosk Hospital OPD Consultation Suite
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Room 104
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Attending Physician: <strong>Dr. Rajesh Sharma, MBBS, MD</strong> • General Medicine OPD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live WebSocket
          </div>

          <Link
            to="/"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>👤 Patient Kiosk View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Clinical Actions Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Stethoscope className="text-blue-600 w-7 h-7" />
            Doctor Clinical Station & Priority Triage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time OPD queue orchestration, rule-verified red flags, 30-sec AI clinical summaries, and instant call chime.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchQueue}
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCallNext}
            disabled={calling || queue.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition disabled:opacity-50 text-sm"
          >
            <Volume2 className="w-5 h-5 text-blue-200" />
            {calling ? 'Calling Patient...' : 'Call Next Patient'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT COLUMN: REAL-TIME OPD QUEUE (4 COLS) ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Emergency Escalations Alert Box */}
          {emergencies.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-2xl p-4 shadow-sm animate-pulse">
              <h2 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Emergency Red-Flag Priority ({emergencies.length})
              </h2>
              <div className="space-y-2">
                {emergencies.map(t => (
                  <div key={t._id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-red-300 dark:border-red-900 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">{t.tokenNumber}</span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">{t.patientName} ({t.age}y)</p>
                      <span className="text-[10px] text-red-600 uppercase font-bold">Immediate Doctor Exam</span>
                    </div>
                    <button
                      onClick={() => { setActivePatient(t); loadPatientSummary(t.encounterId); }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Open Case
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routine & AYUSH OPD Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                Waiting Patients
              </span>
              <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-full">
                {routine.length} in queue
              </span>
            </h2>

            {routine.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">
                No routine patients waiting at this moment.
              </p>
            ) : (
              <div className="space-y-2.5">
                {routine.map((t, idx) => (
                  <div 
                    key={t._id}
                    onClick={() => { setActivePatient(t); loadPatientSummary(t.encounterId); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      activePatient?._id === t._id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{t.tokenNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Pos #{idx + 1}
                        </span>
                        {t.clinicalMode === 'ayush' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            AYUSH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        {t.patientName} • {t.age}y ({t.gender || 'M'})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block">
                        ~{idx * 8}m
                      </span>
                      <span className="text-[10px] text-slate-400">est. wait</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE CONSULTATION EMR WORKSPACE (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <>
              {/* Active Patient Identity & Triage Header */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-900">
                      {activePatient.tokenNumber}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {activePatient.patientName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Age: <strong>{activePatient.age || 30} yrs</strong> | Gender: <strong>{activePatient.gender || 'Unspecified'}</strong> | Dept: <strong>{activePatient.departmentId}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    activePatient.priority === 'emergency'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    Priority: {activePatient.priority}
                  </span>
                </div>
              </div>

              {/* Patient Vitals Triage Bar */}
              {activeEncounter?.vitals && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Kiosk Measured Vitals Telemetry
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-bold block mb-0.5">Blood Pressure</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {activeEncounter.vitals.bpSystolic || 120} / {activeEncounter.vitals.bpDiastolic || 80} mmHg
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-bold block mb-0.5">SpO2 Oxygen</span>
                      <span className={`text-sm font-black ${
                        (activeEncounter.vitals.spO2 || 98) < 95 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {activeEncounter.vitals.spO2 || 98}%
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-bold block mb-0.5">Heart Rate</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {activeEncounter.vitals.heartRate || 76} bpm
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-slate-400 font-bold block mb-0.5">Temperature</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {activeEncounter.vitals.temperature || 98.6}°F
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NEW: PATIENT ANATOMICAL PAIN LOCALIZATION MAP VIEW ── */}
              {painAreas.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-5 border border-amber-300 dark:border-amber-800/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      Patient Documented Anatomical Pain Zones ({painAreas.length})
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                      Direct Body Map Input
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {painAreas.map((p, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.label}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Quality: <strong>{p.quality}</strong>
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          p.intensity === 'severe'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : p.intensity === 'moderate'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                        }`}>
                          {p.intensity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consolidated Single-Paragraph Case Synthesis */}
              {summaryData && (
                <div className="bg-gradient-to-br from-blue-50/90 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30 rounded-2xl p-6 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Consolidated Case Synthesis (One Paragraph)
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Groq AI • 30s Fast Review
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Unified synthesis of chief complaint, answered adaptive questions, and OCR-extracted previous records.
                      </p>
                    </div>
                    
                    {/* Action Controls & Regenerate */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadPatientSummary(activePatient.encounterId, true)}
                        title="Regenerate summary with latest data"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleVerifySummary('accepted')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleVerifySummary('edited')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleVerifySummary('rejected')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  {/* The Single Paragraph Box */}
                  <div className="bg-white/95 dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-blue-200/60 dark:border-slate-700 shadow-sm relative">
                    <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/50 inline-block mb-2">
                      Clinical One-Paragraph Synthesis
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                      {summaryData.conciseDraft || summaryData.oneParaSynthesis}
                    </p>
                  </div>

                  {/* Dual Deep-Dive: Answered Adaptive Questions & Uploaded OCR Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    {/* 1. Answered Adaptive Questions */}
                    <div className="p-4 bg-white/90 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                          Patient Adaptive Answers ({(activeEncounter?.adaptiveAnswers?.length || summaryData.clinicalFacts?.adaptiveAnswers?.length || 0)})
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Patient Input</span>
                      </div>
                      
                      {((activeEncounter?.adaptiveAnswers?.length > 0) || (summaryData.clinicalFacts?.adaptiveAnswers?.length > 0)) ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(activeEncounter?.adaptiveAnswers || summaryData.clinicalFacts?.adaptiveAnswers || []).map((ans, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Q: {ans.question}
                              </p>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">
                                → {ans.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] py-2">
                          No adaptive follow-up questions answered.
                        </p>
                      )}
                    </div>

                    {/* 2. Uploaded Previous Documents & OCR */}
                    <div className="p-4 bg-white/90 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                          Uploaded Records & OCR Findings ({(activeEncounter?.documents?.length || summaryData.clinicalFacts?.documentsReviewed?.length || 0)})
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">OCR Extracted</span>
                      </div>

                      {((activeEncounter?.documents?.length > 0) || (summaryData.clinicalFacts?.documentsReviewed?.length > 0)) ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(activeEncounter?.documents || summaryData.clinicalFacts?.documentsReviewed || []).map((doc, idx) => (
                            <div key={idx} className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  📄 {doc.fileName}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                                  {doc.documentType || 'Prescription'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono line-clamp-3">
                                {doc.ocrText || 'Document verified. No text extracted.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] py-2">
                          No previous records or prescriptions uploaded for this visit.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Output Workspace */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  Doctor Consultation Findings & Orders
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Physician Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Acute Musculoskeletal Chest Wall Strain / Tension Headache"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Prescription & Medication Orders
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Tab Paracetamol 650mg TDS x 3 days; Diclofenac gel topically BD..."
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Clinical Advice & Patient Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Adequate hydration, avoid heavy lifting; Review in 5 days if unresolved"
                    value={advice}
                    onChange={e => setAdvice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* ── LAB INVESTIGATIONS ORDER PAD (Image 4) ── */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4" />
                      Order Hospital Lab Investigations (Dispatches to Central Lab)
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      {selectedLabTests.length} ordered
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_LAB_TESTS.map((test) => {
                      const checked = selectedLabTests.includes(test);
                      return (
                        <label
                          key={test}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                            checked
                              ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedLabTests(selectedLabTests.filter(t => t !== test));
                              } else {
                                setSelectedLabTests([...selectedLabTests, test]);
                              }
                            }}
                          />
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            checked ? 'bg-white border-white text-purple-600' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span className="truncate">{test}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedLabTests.length > 0 && (
                    <input
                      type="text"
                      placeholder="Special instructions for lab technician (e.g., Fasting 12 hrs, Stat urgency)..."
                      value={labInstructions}
                      onChange={e => setLabInstructions(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                {/* ── AUTO FOLLOW-UP SCHEDULING (Image 4: Auto, No Re-Registration) ── */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Auto Follow-Up Booking (No Re-Registration Needed)
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { id: 'none', label: 'No Follow-up Required' },
                      { id: '3_days', label: 'Review in 3 Days' },
                      { id: '1_week', label: 'Review in 1 Week' },
                      { id: '2_weeks', label: 'Review in 2 Weeks' },
                      { id: '1_month', label: 'Review in 1 Month' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFollowUpWindow(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          followUpWindow === opt.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCompleteConsultation}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-md transition"
                >
                  Finalize & Conclude Consultation
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">No Active Consultation</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Select a patient from the waiting queue on the left or tap "Call Next Patient" to review the pre-consultation summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
