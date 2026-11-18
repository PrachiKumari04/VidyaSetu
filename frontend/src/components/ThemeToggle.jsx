import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all duration-300 shadow-sm select-none cursor-pointer group ${
        isDark
          ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-amber-300'
          : 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700'
      } backdrop-blur-md ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-500 rotate-0 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-500 rotate-0 group-hover:-rotate-12" />
        )}
      </div>

      {!compact && (
        <span className="text-xs font-bold tracking-tight">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      {/* Modern sliding pill toggle */}
      <div
        className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 ${
          isDark ? 'bg-amber-500/30 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
        }`}
      >
        <span
          className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${
            isDark ? 'bg-amber-400' : 'bg-indigo-600'
          }`}
        />
      </div>
    </button>
  );
}
