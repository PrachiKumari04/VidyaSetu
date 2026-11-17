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
  ClipboardList,
  Building2,
  FlaskConical,
  TestTube2,
  QrCode
} from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useRole } from '../context/RoleContext';
import { useUser } from '@clerk/clerk-react';

const Sidebar = () => {
  const { theme } = useTheme();
  const { role, selectRole } = useRole();
  const { user } = useUser();

  // 1. Patient Navigation (Strictly patient features only)
  const patientNavItems = [
    { to: '/', icon: Home, label: 'Patient Home' },
    { to: '/intake', icon: ClipboardList, label: 'First-Mile OPD Intake' },
    { to: '/waiting', icon: Clock, label: 'Live Queue & Token' },
    { to: '/vitals', icon: Activity, label: 'Vitals & Device Capture' },
    { to: '/prescriptions', icon: FileText, label: 'Medical Documents & OCR' },
    { to: '/medicines', icon: Pill, label: 'Active Medicines' },
    { to: '/consent', icon: ShieldCheck, label: 'DPDP Privacy Consent' },
    { to: '/profile', icon: UserCircle, label: 'Health Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  // 2. Doctor Navigation (Strictly clinician features only)
  const doctorNavItems = [
    { to: '/doctor', icon: Stethoscope, label: 'Doctor OPD Cockpit' },
    { to: '/prescriptions', icon: FileText, label: 'Electronic Prescriptions' },
    { to: '/vitals', icon: Activity, label: 'Vitals Telemetry' },
    { to: '/waiting', icon: Clock, label: 'OPD Waiting TV Screen' },
    { to: '/settings', icon: Settings, label: 'Doctor Station Settings' }
  ];

  // 3. Lab Technician Navigation (Strictly laboratory features only)
  const labNavItems = [
    { to: '/lab', icon: FlaskConical, label: 'Lab Workorders Queue' },
    { to: '/vitals', icon: Activity, label: 'Patient Clinical Vitals' },
    { to: '/prescriptions', icon: FileText, label: 'Attached Lab Reports' },
    { to: '/settings', icon: Settings, label: 'Lab Configuration' }
  ];

  let currentNavItems = patientNavItems;
  let brandingTitle = 'Patient Intake System';
  let brandingAccent = 'text-emerald-500';

  if (role === 'doctor') {
    currentNavItems = doctorNavItems;
    brandingTitle = 'Clinician Decision Suite';
    brandingAccent = 'text-blue-500';
  } else if (role === 'lab') {
    currentNavItems = labNavItems;
    brandingTitle = 'Pathology & Diagnostic Lab';
    brandingAccent = 'text-purple-500';
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="vs-sidebar hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bottom-0 px-5 py-6 backdrop-blur-3xl border-r text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500 overflow-y-auto"
        style={theme === 'dark' ? {
          background: role === 'doctor' 
            ? 'rgba(8, 14, 28, 0.9)' 
            : role === 'lab' 
            ? 'rgba(18, 10, 30, 0.9)' 
            : 'rgba(5, 11, 20, 0.8)',
          borderColor: role === 'doctor' ? 'rgba(59, 130, 246, 0.2)' : role === 'lab' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
        } : {
          background: role === 'doctor'
            ? 'linear-gradient(170deg, #ffffff 0%, #eff6ff 60%, #e0f2fe 100%)'
            : role === 'lab'
            ? 'linear-gradient(170deg, #ffffff 0%, #faf5ff 60%, #f3e8ff 100%)'
            : 'linear-gradient(170deg, #ffffff 0%, #f0fdf4 55%, #f0fdf4 100%)',
          borderColor: role === 'doctor' ? 'rgba(59, 130, 246, 0.2)' : role === 'lab' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.18)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.05)'
        }}
      >
        {/* MediKiosk Brand Header */}
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Medi<span className={brandingAccent}>Kiosk</span>
            </h2>
          </div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mt-0.5">
            {brandingTitle}
          </span>
        </div>

        {/* Role Navigation Links */}
        <nav className="flex flex-col space-y-1.5 flex-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/doctor' || item.to === '/lab'}
              className={({ isActive }) => {
                const activeColor = role === 'doctor'
                  ? 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20'
                  : role === 'lab'
                  ? 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20'
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

        {/* User Card */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <SignedIn>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'Prachi Kumari'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate uppercase font-bold tracking-wider">
                  Admin Account
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
            Medi<span className={brandingAccent}>Kiosk</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SignedIn><UserButton /></SignedIn>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
