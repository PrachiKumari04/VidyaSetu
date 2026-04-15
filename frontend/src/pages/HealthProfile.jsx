import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  User, Calendar, Scale, Activity, Droplets, Utensils, AlertTriangle, 
  History, Download, Edit3, ArrowRight, CheckCircle2, Info, Clock, 
  ChevronRight, Heart, Wind, Coffee, Moon, Flame, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const HealthProfile = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  useEffect(() => {
    if (toastMessage) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            setProfile(res.data.data);
            setDataQuality(res.data.dataQuality || null);
          } else {
            setError(t('profile.errors.failed_load'));
          }
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setError(t('profile.errors.connection'));
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-white mb-4">{error}</h2>
      <button onClick={() => window.location.reload()} className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-medium hover:bg-emerald-500 transition-colors">
        {t('profile.errors.retry')}
      </button>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-white mb-4">{t('profile.errors.no_profile')}</h2>
      <Link to="/onboarding" className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-medium hover:bg-emerald-500 transition-colors">
        {t('profile.errors.onboarding')}
      </Link>
    </div>
  );

  const getRelativeTime = (date) => {
    if (!date) return t('profile.values.never');
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return t('profile.values.never');
      const diff = new Date() - d;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return t('profile.values.today');
      if (days === 1) return t('profile.values.yesterday');
      return t('profile.values.days_ago', { val: days });
    } catch (e) {
      return t('profile.values.never');
    }
  };

  const SummarySection = ({ icon: Icon, title, children, lastUpdated }) => (
    <div className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(35,60,111,0.05)] dark:shadow-none hover:shadow-[0_15px_40px_rgba(35,60,111,0.08)] hover:-translate-y-1 hover:border-blue-100 dark:hover:border-emerald-500/40 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/0 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors shadow-sm text-slate-700 dark:text-gray-300">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{title}</h3>
        </div>
        {lastUpdated && (
          <div className="flex items-center text-[9px] text-gray-700 dark:text-gray-300 font-bold bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
            <Clock size={10} className="mr-1" /> {getRelativeTime(lastUpdated)}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const DataItem = ({ label, value, unit = '' }) => (
    <div className="flex justify-between items-center text-sm py-1 relative z-10">
      <span className="text-slate-700 dark:text-gray-300 font-bold">{label}</span>
      <span className="text-slate-900 dark:text-white font-black bg-white/60 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5">
        {value !== null && value !== undefined ? `${value} ${unit}` : '—'}
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-emerald-900/95 border border-emerald-500/50 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center space-x-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-white font-medium text-sm">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-4 text-emerald-400 hover:text-white transition-colors"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header Profile Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1.5 bg-emerald-500 rounded-full" />
             <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] mb-2">{t('profile.title')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] uppercase italic">{t('profile.edit_profile')}</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => window.print()} className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-[1.5rem] font-bold shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]">
              <Download className="w-4 h-4" /> {t('profile.export_profile')}
           </button>
           <Link to="/profile/edit" className="px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-bold shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]">
              <Edit3 className="w-4 h-4" /> {t('profile.edit_profile')}
           </Link>
        </div>
      </div>

      {/* Data Quality Indicator Card */}
      {dataQuality && (
        <div className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden shadow-[0_10px_40px_rgba(35,60,111,0.06)] dark:shadow-none group hover:border-blue-100 dark:hover:border-emerald-500/40 hover:shadow-[0_20px_50px_rgba(35,60,111,0.1)] hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-blue-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/10 dark:group-hover:bg-emerald-500/20 transition-colors duration-700 pointer-events-none group-hover:scale-[1.2]"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative w-28 h-28 shrink-0">
               <svg viewBox="0 0 112 112" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                 <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-200 dark:text-gray-800" />
                 <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="10" fill="transparent" 
                   strokeDasharray={289}
                   strokeDashoffset={289 * (1 - (dataQuality?.score || 0) / 100)}
                   className="text-emerald-500 transition-all duration-1000 ease-out" 
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-gray-900 dark:text-white drop-shadow-sm">
                 {dataQuality?.score || 0}%
               </div>
            </div>
            <div className="flex-1">
               <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  dataQuality?.label === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' : 
                  dataQuality?.label === 'Good' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {t(`profile.quality_${dataQuality?.label?.toLowerCase() || 'basic'}`)} {t('profile.profile_label')}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('profile.data_quality')}</h2>
              <p className="text-slate-700 dark:text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed font-semibold">
                {dataQuality?.message || t('profile.action.update_stats')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sections Grid */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biometrics */}
        <SummarySection 
            icon={User} 
            title={t('profile.identity')}
            lastUpdated={profile?.updatedAt}
          >
          {profile.name?.value && <DataItem label="Name" value={profile.name.value} />}
          <DataItem label="Age" value={profile.age?.value} unit="years" />
          <DataItem label="Gender" value={profile.gender?.value} />
          <DataItem label="Height" value={profile.height?.value} unit="cm" />
          <DataItem label="Weight" value={profile.weight?.value} unit="kg" />
          <div className="pt-2 border-t border-gray-700/50 mt-2">
             <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm">{t('profile.labels.bmi')}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  profile.bmi?.value && profile.bmi.value > 0 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {profile.bmi?.value ? Number(profile.bmi.value).toFixed(1) : '—'} ({profile.bmiCategory?.value || 'N/A'})
                </span>
             </div>
          </div>
        </SummarySection>

        {/* Lifestyle */}
        <SummarySection 
            icon={Activity} 
            title={t('profile.vitals_summary')}
            lastUpdated={profile?.vitals?.updatedAt}
          >
           <DataItem label={t('profile.labels.activity')} value={profile.activityLevel?.value} />
           <DataItem label={t('profile.labels.sleep_quality')} value={profile.sleepHours?.value} unit={t('profile.values.hours')} />
           <DataItem label={t('profile.labels.stress')} value={profile.stressLevel?.value} />
           <DataItem label={t('profile.labels.smoking')} value={profile.isSmoker?.value ? t('profile.values.active') : t('profile.values.non_smoker')} />
           <DataItem label={t('profile.labels.alcohol')} value={profile.alcoholConsumption?.value} />
        </SummarySection>

        {/* Diet */}
         <SummarySection icon={Utensils} title={t('profile.diet_nutrition')} lastUpdated={profile.dietType?.lastUpdated}>
           <DataItem label={t('profile.labels.diet_type')} value={profile.dietType?.value} />
           <DataItem label={t('profile.labels.sugar')} value={profile.sugarIntake?.value} />
           <DataItem label={t('profile.labels.salt')} value={profile.saltIntake?.value} />
           <DataItem label={t('profile.labels.junk_food')} value={profile.junkFoodFrequency?.value} />
           <div className="flex gap-2 mt-2">
              {profile.eatsLeafyGreens?.value && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">{t('profile.values.leafy_greens')}</span>}
              {profile.eatsFruits?.value && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">{t('profile.values.daily_fruits')}</span>}
           </div>
         </SummarySection>

        {/* Allergies & Current Conditions */}
         <SummarySection icon={AlertTriangle} title={t('profile.allergies_medical')} lastUpdated={profile.allergies?.lastUpdated}>
           <div className="space-y-4">
             <div>
               <p className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 font-bold">{t('profile.labels.allergies')}</p>
               <div className="flex flex-wrap gap-2">
                 {profile.allergies?.value?.length > 0 ? profile.allergies.value.map(a => (
                   <span key={a} className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-lg border border-red-500/20">{a}</span>
                 )) : <span className="text-gray-700 dark:text-gray-300 text-sm italic">{t('profile.values.none')}</span>}
               </div>
             </div>
             <div>
               <p className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 font-bold">{t('profile.labels.conditions')}</p>
               <div className="flex flex-wrap gap-2">
                 {profile.medicalHistory?.value?.length > 0 ? profile.medicalHistory.value.map(c => (
                   <span key={c} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-lg border border-blue-500/20">{c}</span>
                 )) : <span className="text-gray-700 dark:text-gray-300 text-sm italic">{t('profile.values.no_history')}</span>}
               </div>
             </div>
           </div>
         </SummarySection>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2rem] p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-2xl shadow-emerald-900/20">
           <div className="absolute top-[-20%] right-[-10%] opacity-20 transform group-hover:scale-125 transition-transform duration-700">
              <CheckCircle2 size={240} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)]" />
           </div>
            <div className="relative z-10 mb-8">
              <h3 className="text-2xl font-black mb-3">{t('profile.action.checkup')}</h3>
              <p className="text-emerald-50 text-base opacity-90 w-3/4 leading-relaxed font-medium">
                {t('profile.action.report_generated')} {getRelativeTime(profile.createdAt)}. {t('profile.action.update_stats')}
              </p>
            </div>
            <Link to="/" className="relative z-10 w-full bg-white/90 backdrop-blur-md text-emerald-700 font-bold py-4 rounded-xl flex items-center justify-center hover:bg-white transition-colors shadow-lg active:scale-[0.98]">
              {t('profile.action.go_dashboard')} <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
      </div>

      {/* Dedicated Contextual Observations Section - Center Aligned */}
      {profile.otherConditions?.value && (
        <div className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-12 text-center animate-in zoom-in duration-500 shadow-xl group hover:border-emerald-500/30 transition-all">
           <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
              <History size={24} />
           </div>
           <h3 className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-[0.3em] font-black mb-4">{t('profile.labels.obs_title')}</h3>
          <p className="text-xl md:text-2xl text-slate-900 dark:text-white font-black italic max-w-4xl mx-auto leading-relaxed">
            "{profile.otherConditions.value}"
          </p>
          <div className="mt-8 flex justify-center">
             <div className="h-1 w-12 bg-emerald-500/30 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;
