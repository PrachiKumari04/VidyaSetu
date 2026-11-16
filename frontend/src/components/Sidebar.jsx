import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Activity, 
  Settings, 
  UserCircle, 
  Pill, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  ClipboardList,
  UserCheck,
  Building2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  const location = useLocation();

  // Mode: 'patient' or 'doctor'
  const isDoctorRoute = location.pathname.startsWith('/doctor');
  const [mode, setMode] = useState(() => {
    return isDoctorRoute ? 'doctor' : (localStorage.getItem('portal_mode') || 'patient');
  });

  useEffect(() => {
    if (isDoctorRoute) {
      setMode('doctor');
      localStorage.setItem('portal_mode', 'doctor');
    }
  }, [isDoctorRoute]);

  const switchMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('portal_mode', newMode);
  };

  // Patient Navigation Items
  const patientNavItems = [
    { to: '/', icon: Home, label: 'Patient Dashboard' },
    { to: '/intake', icon: ClipboardList, label: 'OPD Intake & Body Map' },
    { to: '/waiting', icon: Clock, label: 'Live Queue & Token' },
    { to: '/vitals', icon: Activity, label: 'Vitals & Measurements' },
    { to: '/prescriptions', icon: FileText, label: 'Medical Documents' },
    { to: '/medicines', icon: Pill, label: 'Active Medicines' },
    { to: '/consent', icon: ShieldCheck, label: 'Consent & Privacy' },
    { to: '/profile', icon: UserCircle, label: 'Health Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  // Doctor Navigation Items
  const doctorNavItems = [
    { to: '/doctor', icon: Stethoscope, label: 'Doctor OPD Cockpit' },
    { to: '/prescriptions', icon: FileText, label: 'Electronic Rx & Orders' },
    { to: '/vitals', icon: Activity, label: 'Vitals Telemetry' },
    { to: '/intake', icon: ClipboardList, label: 'Kiosk Intake Preview' },
    { to: '/waiting', icon: Clock, label: 'OPD Waiting Room TV' },
    { to: '/settings', icon: Settings, label: 'Station Settings' }
  ];

  const currentNavItems = mode === 'doctor' ? doctorNavItems : patientNavItems;

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="vs-sidebar hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bottom-0 px-5 py-6 backdrop-blur-3xl border-r text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500 overflow-y-auto"
        style={theme === 'dark' ? {
          background: mode === 'doctor' ? 'rgba(8, 14, 28, 0.85)' : 'rgba(5, 11, 20, 0.7)',
          borderColor: mode === 'doctor' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
        } : {
          background: mode === 'doctor' 
            ? 'linear-gradient(170deg, #ffffff 0%, #eff6ff 60%, #e0f2fe 100%)'
            : 'linear-gradient(170deg, #ffffff 0%, #f0fdf4 55%, #f0fdf4 100%)',
          borderColor: mode === 'doctor' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.18)',
          boxShadow: mode === 'doctor' ? '4px 0 40px rgba(59, 130, 246, 0.1)' : '4px 0 40px rgba(16,185,129,0.1)'
        }}
      >
        {/* MediKiosk Brand Header */}
        <div className="flex flex-col items-center justify-center mb-5 text-center">
          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Medi<span className={mode === 'doctor' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-500'}>Kiosk</span>
            </h2>
          </div>
          <span className={`text-[10px] tracking-widest uppercase font-bold mt-0.5 ${
            mode === 'doctor' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
          }`}>
            {mode === 'doctor' ? 'Clinician Decision Suite' : 'Patient Intake System'}
          </span>
        </div>

        {/* ── ROLE SWITCHER PILL ── */}
        <div className="mb-5 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1 border border-slate-300/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => switchMode('patient')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'patient'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>👤 Patient</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('doctor')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'doctor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>
        </div>

        {/* Doctor Station Meta Card (Visible only in Doctor Mode) */}
        {mode === 'doctor' && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>OPD Room 104 • General</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Attending: <strong>Dr. R. Sharma (MD)</strong>
            </p>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex flex-col space-y-1.5 flex-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => {
                const activeColor = mode === 'doctor'
                  ? 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

                return `flex items-center px-3.5 py-2.5 rounded-xl transition text-sm ${
                  isActive
                    ? `${activeColor} border font-bold shadow-sm`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 font-medium'
                }`;
              }}
            >
              <item.icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Portal Switch Shortcut at bottom */}
        <div className="pt-3 pb-3">
          {mode === 'patient' ? (
            <Link
              to="/doctor"
              onClick={() => switchMode('doctor')}
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition flex items-center justify-between border border-blue-200 dark:border-blue-900/60"
            >
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Doctor Station Login
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/"
              onClick={() => switchMode('patient')}
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-between border border-emerald-200 dark:border-emerald-900/60"
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                Patient Kiosk View
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* User Card */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <SignedIn>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || (mode === 'doctor' ? 'Dr. Consultation Mode' : 'OPD Patient')}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {mode === 'doctor' ? 'Clinical Officer' : 'Kiosk Terminal'}
                </p>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b z-50 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Medi<span className={mode === 'doctor' ? 'text-blue-500' : 'text-emerald-500'}>Kiosk</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
            {mode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchMode(mode === 'doctor' ? 'patient' : 'doctor')}
            className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            {mode === 'doctor' ? '👤 Patient' : '🩺 Doctor'}
          </button>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
