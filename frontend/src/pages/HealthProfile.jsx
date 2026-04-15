import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Scale, Activity, Utensils, AlertTriangle,
  History, Edit3, ArrowRight, CheckCircle2, Clock,
  Heart, Wind, Brain, Venus, X, Zap, Shield,
  Cigarette, Wine, Salad, Apple, TrendingUp, RefreshCw
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const getRelativeTime = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const days = Math.floor((new Date() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  } catch { return null; }
};

const bmiColor = (bmi) => {
  if (!bmi || bmi <= 0) return '#6b7280';
  if (bmi < 18.5) return '#60a5fa';
  if (bmi < 25)   return '#10b981';
  if (bmi < 30)   return '#f59e0b';
  return '#f87171';
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Animated circular ring gauge */
const RingGauge = ({ value = 0, max = 100, color = '#10b981', size = 120, label }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - Math.min(value, max) / max);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white text-xl leading-none">{value}</span>
        {label && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

/** Pill badge */
const Pill = ({ label, active, color = 'emerald' }) => {
  const palettes = {
    emerald: active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
    fuchsia: active ? 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
    blue:    active ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'           : 'bg-white/3 text-gray-600 border-white/8 line-through',
    red:     'bg-red-500/15 text-red-400 border-red-500/30',
    sky:     'bg-sky-500/15 text-sky-400 border-sky-500/30',
  };
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${palettes[color] ?? palettes.emerald}`}>
      {label}
    </span>
  );
};

/** Stat row inside a card */
const StatRow = ({ label, value, unit = '', highlight = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-xs font-semibold text-gray-400">{label}</span>
    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
      highlight ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-100'
    }`}>
      {value !== null && value !== undefined && value !== '' ? `${value}${unit ? ' ' + unit : ''}` : '—'}
    </span>
  </div>
);

/** Section card wrapper */
const Card = ({ children, accent = '#10b981', className = '' }) => (
  <div
    className={`relative rounded-3xl border border-white/8 bg-white/4 backdrop-blur-xl overflow-hidden
      hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl transition-all duration-500 group ${className}`}
    style={{ boxShadow: `0 0 0 0 ${accent}00` }}
  >
    {/* Glow on hover */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl"
      style={{ boxShadow: `inset 0 0 60px ${accent}18` }}
    />
    {children}
  </div>
);

/** Card header strip */
const CardHeader = ({ icon: Icon, title, iconColor, lastUpdated }) => (
  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: `${iconColor}20` }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
    </div>
    {lastUpdated && (
      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
        <Clock size={9} /> {getRelativeTime(lastUpdated) || '—'}
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const HealthProfile = () => {
  const { user } = useUser();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  useEffect(() => {
    if (toastMessage) {
      window.history.replaceState({}, document.title);
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            setProfile(res.data.data);
            setDataQuality(res.data.dataQuality || null);
          } else setError('Failed to load profile data.');
        })
        .catch(() => setError('Connection error to server.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading Bio-Matrix…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-16">
      <p className="text-2xl font-black text-white mb-6">{error}</p>
      <button onClick={() => window.location.reload()}
        className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl text-white font-bold transition-all">
        Retry
      </button>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-2xl font-black text-white mb-6">No Profile Found</p>
      <Link to="/onboarding"
        className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl text-white font-bold transition-all">
        Complete Onboarding
      </Link>
    </div>
  );

  const bmi = profile.bmi?.value ? Number(profile.bmi.value).toFixed(1) : null;
  const bmiCat = profile.bmiCategory?.value || '';
  const qualityScore = dataQuality?.score || 0;
  const isFemale = profile.gender?.value?.toLowerCase() === 'female';
  const initials = (profile.name?.value || user?.fullName || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/40 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_8px_40px_rgba(16,185,129,0.35)] flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-white font-semibold text-sm">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ── */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 border border-white/8"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a12 50%, #0a0f1e 100%)' }}>
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        </div>

        <div className="relative z-10 p-8 lg:p-12 flex flex-col md:flex-row md:items-center gap-8">
          {/* Avatar — Clerk profile photo with initials fallback */}
          <div className="relative flex-shrink-0">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={profile.name?.value || user?.fullName || 'User'}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white border border-emerald-500/30"
                style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          {/* Name + subtitle */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Health Matrix
              </span>
              {dataQuality?.label && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  dataQuality.label === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : dataQuality.label === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {dataQuality.label} Profile
                </span>
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
              {profile.name?.value || user?.fullName || 'Your Profile'}
            </h1>
            <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
              Real-time overview of your foundational health metrics and physiological parameters.
            </p>
          </div>


          {/* Action buttons */}
          <div className="flex flex-row md:flex-col gap-3 flex-shrink-0">
            <Link to="/history"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/6 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 hover:text-white transition-all">
              <History size={15} /> History
            </Link>
            <Link to="/profile/edit"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95">
              <Edit3 size={15} /> Update
            </Link>
          </div>
        </div>
      </div>

      {/* ── DATA QUALITY BANNER ── */}
      {dataQuality && (
        <div className="relative rounded-3xl border border-white/8 bg-white/4 backdrop-blur-xl overflow-hidden mb-8 p-6 lg:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)', transform: 'translate(30%,-30%)' }} />

          <RingGauge value={qualityScore} max={100} color="#10b981" size={100} label="Quality" />

          <div className="flex-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Bio-Data Completeness</p>
            <h2 className="text-2xl font-black text-white mb-2">Data Quality Score</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
              {dataQuality.message || 'Update your profile to improve AI insights.'}
            </p>
          </div>

          {/* Mini progress bars */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            {[
              { label: 'Biometrics', pct: profile.weight?.value ? 100 : 40 },
              { label: 'Lifestyle', pct: profile.activityLevel?.value ? 100 : 30 },
              { label: 'Diet', pct: profile.dietType?.value ? 100 : 30 },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <span>{bar.label}</span><span>{bar.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* 1. Biometrics */}
        <Card accent="#10b981">
          <CardHeader icon={Scale} title="Biometrics" iconColor="#10b981" lastUpdated={profile.weight?.lastUpdated} />
          <div className="px-6 py-5 flex gap-5 items-center">
            {bmi && (
              <div className="flex-shrink-0 text-center">
                <RingGauge
                  value={Math.round(parseFloat(bmi))}
                  max={40}
                  color={bmiColor(parseFloat(bmi))}
                  size={84}
                  label="BMI"
                />
                <p className="text-[10px] font-bold mt-1.5" style={{ color: bmiColor(parseFloat(bmi)) }}>
                  {bmiCat}
                </p>
              </div>
            )}
            <div className="flex-1">
              <StatRow label="Height" value={profile.height?.value} unit="cm" />
              <StatRow label="Weight" value={profile.weight?.value} unit="kg" />
              <StatRow label="Age" value={profile.age?.value} unit="yrs" />
              <StatRow label="Gender" value={profile.gender?.value} />
            </div>
          </div>
        </Card>

        {/* 2. Lifestyle */}
        <Card accent="#8b5cf6">
          <CardHeader icon={Activity} title="Lifestyle & Habits" iconColor="#8b5cf6" lastUpdated={profile.activityLevel?.lastUpdated} />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Activity Level" value={profile.activityLevel?.value} />
            <StatRow label="Sleep" value={profile.sleepHours?.value} unit="hrs" />
            <StatRow label="Stress" value={profile.stressLevel?.value} />
            <div className="flex gap-2 pt-3 flex-wrap">
              <Pill label={profile.isSmoker?.value ? '🚬 Smoker' : '✓ Non-smoker'}
                active={!profile.isSmoker?.value} color="emerald" />
              <Pill label={`🍷 Alcohol: ${profile.alcoholConsumption?.value || '—'}`}
                active={!!(profile.alcoholConsumption?.value)} color="blue" />
            </div>
          </div>
        </Card>

        {/* 3. Diet */}
        <Card accent="#f59e0b">
          <CardHeader icon={Utensils} title="Diet & Nutrition" iconColor="#f59e0b" lastUpdated={profile.dietType?.lastUpdated} />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Diet Type" value={profile.dietType?.value} highlight />
            <StatRow label="Sugar Intake" value={profile.sugarIntake?.value} />
            <StatRow label="Salt Intake" value={profile.saltIntake?.value} />
            <StatRow label="Junk Food" value={profile.junkFoodFrequency?.value} />
            <div className="flex gap-2 pt-3 flex-wrap">
              <Pill label="🥬 Leafy Greens" active={!!profile.eatsLeafyGreens?.value} color="emerald" />
              <Pill label="🍎 Daily Fruits" active={!!profile.eatsFruits?.value} color="emerald" />
            </div>
          </div>
        </Card>

        {/* 4. Women's Health (conditional) */}
        {isFemale && (
          <Card accent="#e879f9">
            <CardHeader icon={Venus} title="Women's Health" iconColor="#e879f9" lastUpdated={profile.pcosDiagnosis?.lastUpdated} />
            <div className="px-6 py-5">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Reported Indicators</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'menstrualCycleIrregular', label: 'Irregular Cycles' },
                  { id: 'facialBodyHairExcess',    label: 'Excess Hair Growth' },
                  { id: 'persistentAcne',           label: 'Persistent Acne' },
                  { id: 'tryingToConceiveDifficulty', label: 'Conception Difficulty' },
                  { id: 'pcosDiagnosis',            label: 'PCOS Diagnosis' },
                ].map(item => (
                  <Pill key={item.id} label={item.label} active={!!profile[item.id]?.value} color="fuchsia" />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 5. Respiratory */}
        <Card accent="#38bdf8">
          <CardHeader icon={Wind} title="Respiratory & Environment" iconColor="#38bdf8" lastUpdated={profile.wheezing?.lastUpdated} />
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Reported Indicators</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'wheezing',          label: 'Wheezing' },
                { id: 'persistentCough',   label: 'Persistent Cough' },
                { id: 'shortnessBreath',   label: 'Shortness of Breath' },
                { id: 'highPollutionArea', label: 'High Pollution Area' },
                { id: 'biomassFuelUse',    label: 'Biomass Fuel Use' },
                { id: 'seasonalAllergies', label: 'Seasonal Allergies' },
              ].map(item => (
                <Pill key={item.id} label={item.label} active={!!profile[item.id]?.value} color="blue" />
              ))}
            </div>
          </div>
        </Card>

        {/* 6. Mental Wellbeing */}
        <Card accent="#6ee7b7">
          <CardHeader icon={Brain} title="Mental Wellbeing" iconColor="#6ee7b7" lastUpdated={profile.mentalHealthDepressed?.lastUpdated} />
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">🔒 Strictly Confidential</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'mentalHealthDepressed',  label: 'Feeling Depressed' },
                { id: 'lostInterestActivities', label: 'Loss of Interest' },
                { id: 'mentalHealthAnxiety',    label: 'Anxiety / On Edge' },
                { id: 'energyLevelsLow',        label: 'Low Energy / Fatigue' },
              ].map(item => (
                <Pill key={item.id} label={item.label} active={!!profile[item.id]?.value} color="emerald" />
              ))}
            </div>
          </div>
        </Card>

        {/* 7. Allergies & Medical */}
        <Card accent="#f87171">
          <CardHeader icon={AlertTriangle} title="Allergies & Medical" iconColor="#f87171" lastUpdated={profile.allergies?.lastUpdated} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {profile.allergies?.value?.length > 0
                  ? profile.allergies.value.map(a => <Pill key={a} label={a} active color="red" />)
                  : <span className="text-xs text-gray-600 italic">None declared</span>}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Medical History</p>
              <div className="flex flex-wrap gap-2">
                {profile.medicalHistory?.value?.length > 0
                  ? profile.medicalHistory.value.map(c => <Pill key={c} label={c} active color="sky" />)
                  : <span className="text-xs text-gray-600 italic">None provided</span>}
              </div>
            </div>
            {profile.otherConditions?.value && (
              <div className="border-t border-white/6 pt-3">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Observations</p>
                <p className="text-xs text-gray-400 italic leading-relaxed">"{profile.otherConditions.value}"</p>
              </div>
            )}
          </div>
        </Card>

        {/* 8. CTA Card */}
        <Card accent="#10b981" className="md:col-span-2 xl:col-span-1">
          <div className="relative overflow-hidden h-full min-h-[200px]"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #047857 100%)' }}>
            <div className="absolute -top-8 -right-8 opacity-[0.12] pointer-events-none">
              <TrendingUp size={180} className="text-white" />
            </div>
            <div className="relative z-10 p-8 flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Ready for a check-up?</h3>
                <p className="text-emerald-100/80 text-sm leading-relaxed">
                  {profile.createdAt
                    ? `Last AI report: ${getRelativeTime(profile.createdAt) || 'some time ago'}. Sync for fresh insights.`
                    : 'Update your profile to unlock AI health insights.'}
                </p>
              </div>
              <Link to="/"
                className="mt-6 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 text-sm">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default HealthProfile;
