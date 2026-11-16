import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
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
  Clock
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function DoctorDashboard() {
  const doctorId = 'doc_default';
  const [queue, setQueue] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Consultation state
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');

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

  const loadPatientSummary = async (encounterId) => {
    try {
      const res = await axios.get(`${API_URL.replace('/api', '')}/api/summary/${encounterId}`);
      if (res.data?.success) {
        setSummaryData(res.data.summary);
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

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const res = await axios.post(`${API_URL.replace('/api', '')}/api/queue/doctor/${doctorId}/call-next`);
      if (res.data?.success && res.data.calledToken) {
        setActivePatient(res.data.calledToken);
        loadPatientSummary(res.data.calledToken.encounterId);
        fetchQueue();
      } else {
        alert(res.data?.message || 'No patients waiting.');
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
      await axios.post(`${API_URL.replace('/api', '')}/api/encounters/${activePatient.encounterId}/complete`, {
        diagnosis,
        advice,
        prescription: { notes: prescription }
      });
      alert('Consultation closed & recorded to encounter!');
      setActivePatient(null);
      setSummaryData(null);
      setDiagnosis('');
      setPrescription('');
      setAdvice('');
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const emergencies = queue.filter(t => t.priority === 'emergency');
  const routine = queue.filter(t => t.priority !== 'emergency');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="text-emerald-500 w-7 h-7" />
            MediKiosk Clinician Station & Real-Time OPD Queue
          </h1>
          <p className="text-sm text-slate-500">
            Assisted 30-Second Pre-Consultation Summaries & Live Patient Call
          </p>
        </div>

        <button
          onClick={handleCallNext}
          disabled={calling || queue.length === 0}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          <Users className="w-5 h-5" />
          {calling ? 'Calling...' : 'Call Next Patient'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Real-Time Queue */}
        <div className="space-y-6">
          {/* Emergency Escalations */}
          {emergencies.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-400 rounded-2xl p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Emergency Priority ({emergencies.length})
              </h2>
              <div className="space-y-2">
                {emergencies.map(t => (
                  <div key={t._id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">{t.tokenNumber}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.patientName} ({t.age}y, {t.gender})</p>
                    </div>
                    <button
                      onClick={() => { setActivePatient(t); loadPatientSummary(t.encounterId); }}
                      className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Open Case
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routine & Follow-Up Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between mb-4">
              <span>Active Waiting Queue</span>
              <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                {routine.length} waiting
              </span>
            </h2>

            {routine.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No patients currently in queue</p>
            ) : (
              <div className="space-y-2.5">
                {routine.map((t, idx) => (
                  <div 
                    key={t._id}
                    onClick={() => { setActivePatient(t); loadPatientSummary(t.encounterId); }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      activePatient?._id === t._id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{t.tokenNumber}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Pos #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.patientName} • {t.age}y</p>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ~{idx * 8}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: 30-Second AI Clinical Summary & Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activePatient ? (
            <>
              {/* Top Banner: Patient identity */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {activePatient.tokenNumber}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {activePatient.patientName}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Age: {activePatient.age || 'Unspecified'} | Gender: {activePatient.gender || 'Unspecified'} | Dept: {activePatient.departmentId}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  activePatient.priority === 'emergency'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {activePatient.priority}
                </span>
              </div>

              {/* 30-Second AI Clinical Summary */}
              {summaryData && (
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      30-Second Assistive Summary (Clinician Review Draft)
                    </h3>
                    
                    {/* Doctor Action Controls (FR-15: Accept, Edit, Reject) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifySummary('accepted')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Accept Draft
                      </button>
                      <button
                        onClick={() => handleVerifySummary('edited')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleVerifySummary('rejected')}
                        disabled={verifying}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    {summaryData.conciseDraft}
                  </p>

                  {/* Source-Tagged Evidence Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Chief Symptoms & Source</p>
                      <ul className="space-y-1">
                        {summaryData.clinicalFacts?.symptoms?.map((s, idx) => (
                          <li key={idx} className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                            <span>• {s.text}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500">
                              {s.source}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Timeline Shifts & Changes</p>
                      <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                        {summaryData.changes?.map((chg, idx) => (
                          <li key={idx}>• {chg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Output Workspace */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Consultation Findings & Orders
                </h3>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Physician Clinical Diagnosis</label>
                  <input
                    type="text"
                    placeholder="E.g., Acute Bronchitis / Musculoskeletal chest strain"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Prescription & Rx Details</label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Paracetamol 650mg TDS x 3 days, Steam inhalation..."
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Clinical Advice & Follow-Up</label>
                  <input
                    type="text"
                    placeholder="E.g., Review in 5 days if fever persists; CBC test ordered"
                    value={advice}
                    onChange={e => setAdvice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm"
                  />
                </div>

                <button
                  onClick={handleCompleteConsultation}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Finalize & Conclude Consultation
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">No Active Consultation</h2>
              <p className="text-sm text-slate-500 mt-1">
                Select a patient from the waiting queue on the left or tap "Call Next Patient".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
