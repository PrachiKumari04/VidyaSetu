import React from 'react';
import { useRole } from '../context/RoleContext';
import { User, Stethoscope, FlaskConical } from 'lucide-react';

export default function RoleHeaderSwitcher() {
  const { role, selectRole } = useRole();

  const roles = [
    { id: 'patient', label: 'Patient Kiosk', icon: User, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'doctor', label: 'Doctor Station', icon: Stethoscope, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'lab', label: 'Lab Technician', icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400' }
  ];

  return (
    <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
        Persona:
      </span>
      {roles.map((r) => {
        const active = role === r.id;
        const Icon = r.icon;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => selectRole(r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              active
                ? r.id === 'patient'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : r.id === 'doctor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
