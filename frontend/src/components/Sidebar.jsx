import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  ClipboardList 
} from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();

  // MediKiosk Navigation Items (Chapter 4, 5)
  const navItems = [
    { to: '/intake', icon: ClipboardList, label: 'OPD Intake & Triage' },
    { to: '/waiting', icon: Clock, label: 'Live Queue & Token' },
    { to: '/doctor', icon: Stethoscope, label: 'Doctor Station' },
    { to: '/', icon: Home, label: 'Patient Dashboard' },
    { to: '/vitals', icon: Activity, label: 'Vitals Capture' },
    { to: '/prescriptions', icon: FileText, label: 'Medical Documents' },
    { to: '/medicines', icon: Pill, label: 'Active Medicines' },
    { to: '/consent', icon: ShieldCheck, label: 'Consent & Privacy' },
    { to: '/profile', icon: UserCircle, label: 'Health Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="vs-sidebar hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bottom-0 px-5 py-8 backdrop-blur-3xl border-r text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500 overflow-y-auto"
        style={theme === 'dark' ? {
          background: 'rgba(5, 11, 20, 0.7)',
          borderColor: 'rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
        } : {
          background: 'linear-gradient(170deg, #ffffff 0%, #f0fdf4 55%, #f0fdf4 100%)',
          borderColor: 'rgba(16, 185, 129, 0.18)',
          boxShadow: '4px 0 40px rgba(16,185,129,0.1)'
        }}
      >
        {/* MediKiosk Brand Header */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Medi<span className="text-emerald-500">Kiosk</span>
          </h2>
          <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mt-0.5">
            Patient Intake System
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col space-y-1.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-xl transition text-sm ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100/50 dark:hover:bg-white/5 font-medium'
                }`
              }
            >
              <item.icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <SignedIn>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'OPD Patient'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Kiosk Mode Active</p>
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
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Medi<span className="text-emerald-500">Kiosk</span>
        </h2>
        <div className="flex items-center gap-3">
          <Link to="/intake" className="text-xs font-bold text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950">
            + Intake
          </Link>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
