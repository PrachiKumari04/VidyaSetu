import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ClipboardList, 
  Clock, 
  Stethoscope, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Pill, 
  ArrowRight,
  Sparkles,
  HeartPulse,
  User
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const patientId = user?.id || 'guest_patient_001';

  const [activeToken, setActiveToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tokenRes, profileRes, vitalsRes] = await Promise.allSettled([
          axios.get(`${API_URL.replace('/api', '')}/api/queue/patient/${patientId}/current`),
          axios.get(`${API_URL}/profile/${patientId}`),
          axios.get(`${API_URL}/vitals/latest/${patientId}`)
        ]);

        if (tokenRes.status === 'fulfilled' && tokenRes.value.data?.success) {
          setActiveToken(tokenRes.value.data.token);
        }
        if (profileRes.status === 'fulfilled' && profileRes.value.data?.data) {
          setProfile(profileRes.value.data.data);
        }
        if (vitalsRes.status === 'fulfilled' && vitalsRes.value.data?.vitals) {
          setVitals(vitalsRes.value.data.vitals);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase">
            AI-Enabled First-Mile Clinical Intake
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">
            Namaste, {user?.firstName || 'Patient'}
          </h1>
          <p className="mt-1 text-emerald-50 text-sm max-w-xl">
            MediKiosk prepares your structured history and vital signs before your OPD consultation, saving precious clinical time.
          </p>
        </div>

        <button
          onClick={() => navigate('/intake')}
          className="px-6 py-3.5 bg-white text-emerald-800 font-extrabold rounded-2xl shadow-lg hover:bg-emerald-50 transition flex items-center gap-2 text-sm shrink-0"
        >
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          Start OPD Intake
          <ArrowRight className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Active Token Callout if waiting in queue */}
      {activeToken && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-emerald-500 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 rounded-2xl flex items-center justify-center font-mono font-black text-xl">
              {activeToken.tokenNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Active Consultation Queue
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeToken.doctorName} • Position: <strong>#{activeToken.position}</strong> (Est. wait: ~{activeToken.estimatedWaitMinutes}m)
              </p>
            </div>
          </div>

          <Link
            to="/waiting"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            <Clock className="w-4 h-4" />
            Open Live Queue Screen
          </Link>
        </div>
      )}

      {/* 4 Core Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link 
          to="/intake"
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm transition group"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">New Intake</h3>
          <p className="text-xs text-slate-500 mt-1">Multi-modal voice & symptom input before doctor visit</p>
        </Link>

        <Link 
          to="/waiting"
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm transition group"
        >
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Live OPD Queue</h3>
          <p className="text-xs text-slate-500 mt-1">Dynamic ETA, position tracking, and call alerts</p>
        </Link>

        <Link 
          to="/doctor"
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm transition group"
        >
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Doctor Station</h3>
          <p className="text-xs text-slate-500 mt-1">Review 30-second AI summary & call patients</p>
        </Link>

        <Link 
          to="/vitals"
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm transition group"
        >
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Vitals & Tests</h3>
          <p className="text-xs text-slate-500 mt-1">Record BP, SpO2, pulse, and lab reports</p>
        </Link>
      </div>

      {/* Patient Health Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <HeartPulse className="w-5 h-5 text-emerald-500" />
          Patient Clinical Profile Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Known Allergies</span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {profile?.allergies?.length ? profile.allergies.join(', ') : 'No documented allergies'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Chronic Conditions</span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {profile?.chronicConditions?.length ? profile.chronicConditions.join(', ') : 'None documented'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Active Prescriptions</span>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {profile?.medications?.length ? `${profile.medications.length} active medicine(s)` : 'None active'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
