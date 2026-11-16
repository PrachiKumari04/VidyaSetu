import React, { useState } from 'react';
import { 
  RotateCw, 
  AlertCircle, 
  X, 
  Check, 
  Flame, 
  Activity, 
  ShieldAlert,
  Info
} from 'lucide-react';

// Anatomical region definitions with precise SVG geometry
const REGIONS = {
  front: [
    {
      id: 'head',
      label: 'Head & Cranium',
      d: 'M 100 22 C 86 22 75 34 75 50 C 75 64 85 76 92 80 L 108 80 C 115 76 125 64 125 50 C 125 34 114 22 100 22 Z',
      badgePos: { x: 100, y: 50 },
      redFlagKey: 'head',
      commonSymptoms: ['Severe Headache', 'Dizziness / Vertigo', 'Facial Pressure', 'Eye Strain']
    },
    {
      id: 'neck',
      label: 'Neck & Throat',
      d: 'M 92 80 L 90 98 C 96 102 104 102 110 98 L 108 80 Z',
      badgePos: { x: 100, y: 89 },
      redFlagKey: 'throat',
      commonSymptoms: ['Sore Throat', 'Difficulty Swallowing', 'Neck Stiffness', 'Thyroid Pain']
    },
    {
      id: 'chest',
      label: 'Chest & Thorax',
      d: 'M 72 102 C 60 106 58 118 56 132 L 62 165 C 75 166 88 167 100 167 C 112 167 125 166 138 165 L 144 132 C 142 118 140 106 128 102 C 120 108 110 110 100 110 C 90 110 80 108 72 102 Z',
      badgePos: { x: 100, y: 135 },
      redFlagKey: 'chest',
      commonSymptoms: ['Chest Pain / Tightness', 'Shortness of Breath', 'Palpitations', 'Chest Pressure']
    },
    {
      id: 'left_shoulder_arm',
      label: 'Left Shoulder & Arm',
      d: 'M 138 102 L 152 110 C 160 125 166 148 172 175 C 174 186 170 200 166 215 L 156 212 C 160 198 162 184 158 170 L 146 132 Z',
      badgePos: { x: 160, y: 155 },
      redFlagKey: 'arm',
      commonSymptoms: ['Left Arm Radiating Pain', 'Shoulder Stiffness', 'Numbness in Fingers', 'Joint Aches']
    },
    {
      id: 'right_shoulder_arm',
      label: 'Right Shoulder & Arm',
      d: 'M 62 102 L 48 110 C 40 125 34 148 28 175 C 26 186 30 200 34 215 L 44 212 C 40 198 38 184 42 170 L 54 132 Z',
      badgePos: { x: 40, y: 155 },
      redFlagKey: null,
      commonSymptoms: ['Right Shoulder Pain', 'Arm Strain', 'Elbow Pain', 'Wrist Soreness']
    },
    {
      id: 'upper_abdomen',
      label: 'Upper Abdomen / Epigastric',
      d: 'M 62 165 L 65 195 C 76 197 88 198 100 198 C 112 198 124 197 135 195 L 138 165 C 125 166 112 167 100 167 C 88 167 75 166 62 165 Z',
      badgePos: { x: 100, y: 181 },
      redFlagKey: 'abdomen',
      commonSymptoms: ['Acid Reflux / Burning', 'Stomach Cramps', 'Epigastric Pressure', 'Nausea / Bloating']
    },
    {
      id: 'lower_abdomen_pelvis',
      label: 'Lower Abdomen & Pelvis',
      d: 'M 65 195 L 68 225 C 75 240 85 248 100 248 C 115 248 125 240 132 225 L 135 195 C 124 197 112 198 100 198 C 88 198 76 197 65 195 Z',
      badgePos: { x: 100, y: 222 },
      redFlagKey: 'abdomen',
      commonSymptoms: ['Lower Abdominal Cramping', 'Pelvic Discomfort', 'Groin Strain', 'Urinary Burning']
    },
    {
      id: 'right_thigh',
      label: 'Right Thigh & Quad',
      d: 'M 72 240 L 68 290 C 72 300 80 302 88 300 L 94 246 C 86 246 78 243 72 240 Z',
      badgePos: { x: 80, y: 270 },
      redFlagKey: null,
      commonSymptoms: ['Quadriceps Strain', 'Hip Flexor Pain', 'Thigh Muscle Soreness']
    },
    {
      id: 'left_thigh',
      label: 'Left Thigh & Quad',
      d: 'M 128 240 L 132 290 C 128 300 120 302 112 300 L 106 246 C 114 246 122 243 128 240 Z',
      badgePos: { x: 120, y: 270 },
      redFlagKey: null,
      commonSymptoms: ['Quadriceps Strain', 'Hip Flexor Pain', 'Thigh Muscle Soreness']
    },
    {
      id: 'right_knee_leg',
      label: 'Right Knee & Shin',
      d: 'M 68 300 L 66 360 C 70 372 78 372 84 360 L 88 300 C 80 302 72 300 68 300 Z',
      badgePos: { x: 76, y: 335 },
      redFlagKey: null,
      commonSymptoms: ['Knee Joint Pain / Arthritis', 'Shin Splints', 'Swelling / Stiffness']
    },
    {
      id: 'left_knee_leg',
      label: 'Left Knee & Shin',
      d: 'M 132 300 L 134 360 C 130 372 122 372 116 360 L 112 300 C 120 302 128 300 132 300 Z',
      badgePos: { x: 124, y: 335 },
      redFlagKey: null,
      commonSymptoms: ['Knee Joint Pain / Arthritis', 'Shin Splints', 'Swelling / Stiffness']
    },
    {
      id: 'feet',
      label: 'Ankles & Feet',
      d: 'M 64 365 L 56 385 C 64 390 82 390 84 382 L 84 365 Z M 136 365 L 144 385 C 136 390 118 390 116 382 L 116 365 Z',
      badgePos: { x: 100, y: 375 },
      redFlagKey: null,
      commonSymptoms: ['Ankle Sprain', 'Foot Swelling / Edema', 'Plantar Fasciitis', 'Gout Tenderness']
    }
  ],
  back: [
    {
      id: 'occiput_back_head',
      label: 'Occiput & Back of Head',
      d: 'M 100 22 C 86 22 75 34 75 50 C 75 64 85 76 92 80 L 108 80 C 115 76 125 64 125 50 C 125 34 114 22 100 22 Z',
      badgePos: { x: 100, y: 50 },
      redFlagKey: 'head',
      commonSymptoms: ['Tension Headache', 'Occipital Neuralgia', 'Base-of-Skull Stiffness']
    },
    {
      id: 'cervical_spine',
      label: 'Cervical Spine & Neck',
      d: 'M 92 80 L 90 98 C 96 102 104 102 110 98 L 108 80 Z',
      badgePos: { x: 100, y: 89 },
      redFlagKey: null,
      commonSymptoms: ['Cervical Spondylosis', 'Pinched Nerve', 'Neck Spasm / Torticollis']
    },
    {
      id: 'upper_back_trapezius',
      label: 'Upper Back & Shoulder Blades',
      d: 'M 72 102 C 60 106 58 118 56 132 L 62 170 C 75 172 88 174 100 174 C 112 174 125 172 138 170 L 144 132 C 142 118 140 106 128 102 C 120 106 110 108 100 108 C 90 108 80 106 72 102 Z',
      badgePos: { x: 100, y: 138 },
      redFlagKey: null,
      commonSymptoms: ['Scapular Knot / Spasm', 'Interscapular Ache', 'Trapezius Strain']
    },
    {
      id: 'lumbar_lower_back',
      label: 'Lumbar Spine & Lower Back',
      d: 'M 62 170 L 66 220 C 76 226 88 228 100 228 C 112 228 124 226 134 220 L 138 170 C 125 172 112 174 100 174 C 88 174 75 172 62 170 Z',
      badgePos: { x: 100, y: 198 },
      redFlagKey: 'back',
      commonSymptoms: ['Severe Lower Back Pain', 'Sciatica Shooting Pain', 'Kidney Angle Pain', 'Disc Herniation Ache']
    },
    {
      id: 'gluteal_sacral',
      label: 'Gluteal & Sacrum',
      d: 'M 66 220 L 68 250 C 76 260 88 262 100 262 C 112 262 124 260 132 250 L 134 220 C 124 226 112 228 100 228 C 88 228 76 226 66 220 Z',
      badgePos: { x: 100, y: 242 },
      redFlagKey: null,
      commonSymptoms: ['Piriformis Syndrome', 'Tailbone / Sacral Pain', 'Hip Joint Stiffness']
    },
    {
      id: 'hamstrings_calves',
      label: 'Hamstrings & Calves',
      d: 'M 72 255 L 68 360 C 74 372 84 372 88 360 L 92 258 Z M 128 255 L 132 360 C 126 372 116 372 112 360 L 108 258 Z',
      badgePos: { x: 100, y: 310 },
      redFlagKey: null,
      commonSymptoms: ['Hamstring Pull', 'Calf Cramps', 'Achilles Tenderness', 'Varicose Leg Heaviness']
    }
  ]
};

const PAIN_INTENSITIES = [
  { value: 'mild', label: 'Mild (1-3)', color: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300' },
  { value: 'moderate', label: 'Moderate (4-6)', color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
  { value: 'severe', label: 'Severe / Excruciating (7-10)', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' }
];

const PAIN_QUALITIES = [
  'Sharp / Stabbing',
  'Dull Ache',
  'Throbbing',
  'Burning',
  'Radiating',
  'Cramping / Spasm',
  'Stiffness'
];

export default function InteractiveBodyMap({ onPainAreasChange, initialAreas = [] }) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [selectedAreas, setSelectedAreas] = useState(initialAreas);
  const [activeRegion, setActiveRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const activeRegionsList = REGIONS[view];

  const handleRegionClick = (region) => {
    const existing = selectedAreas.find(a => a.id === region.id);
    if (existing) {
      // Open editor for this existing region
      setActiveRegion(existing);
    } else {
      // Add new region with default moderate pain
      const newArea = {
        id: region.id,
        label: region.label,
        view,
        intensity: 'moderate',
        quality: 'Dull Ache',
        redFlagKey: region.redFlagKey,
        commonSymptoms: region.commonSymptoms
      };
      const updated = [...selectedAreas, newArea];
      setSelectedAreas(updated);
      setActiveRegion(newArea);
      notifyParent(updated);
    }
  };

  const handleRemoveArea = (id) => {
    const updated = selectedAreas.filter(a => a.id !== id);
    setSelectedAreas(updated);
    if (activeRegion?.id === id) {
      setActiveRegion(null);
    }
    notifyParent(updated);
  };

  const handleUpdateActiveArea = (updates) => {
    if (!activeRegion) return;
    const updatedArea = { ...activeRegion, ...updates };
    const updated = selectedAreas.map(a => a.id === updatedArea.id ? updatedArea : a);
    setSelectedAreas(updated);
    setActiveRegion(updatedArea);
    notifyParent(updated);
  };

  const notifyParent = (areas) => {
    if (!onPainAreasChange) return;
    
    // Construct rich clinical description string
    let summaryText = '';
    if (areas.length > 0) {
      const descriptions = areas.map(a => 
        `${a.label} [${a.intensity.toUpperCase()} intensity - ${a.quality}]`
      );
      summaryText = `Anatomical pain indicated in: ${descriptions.join('; ')}.`;
    }
    onPainAreasChange(areas, summaryText);
  };

  const getIntensityConfig = (intensity) => {
    return PAIN_INTENSITIES.find(p => p.value === intensity) || PAIN_INTENSITIES[1];
  };

  const isAreaSelected = (id) => {
    return selectedAreas.find(a => a.id === id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Interactive Anatomical Body Pain Map
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tap directly on the body illustration to pinpoint where you feel pain, ache, or discomfort.
          </p>
        </div>

        {/* Front / Back Toggle Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setView('front')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              view === 'front'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => setView('back')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              view === 'back'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Posterior (Back)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Pain Specifier Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        
        {/* Left Visual Interactive Body Canvas (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 relative min-h-[440px]">
          
          <div className="absolute top-3 left-3 text-[11px] font-bold tracking-wider uppercase text-slate-400">
            {view === 'front' ? 'Anterior View' : 'Posterior View'}
          </div>

          {hoveredRegion && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-sm animate-in fade-in duration-200 pointer-events-none">
              {hoveredRegion.label}
            </div>
          )}

          {/* SVG Vector Body Illustration */}
          <svg
            viewBox="0 0 200 420"
            className="w-full max-w-[240px] h-auto drop-shadow-md select-none cursor-pointer"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}
          >
            <defs>
              {/* Glowing animated pain filters */}
              <filter id="painGlowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="haloPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient Silhouette Reference Behind */}
            <g opacity="0.08" className="dark:opacity-20 pointer-events-none">
              <circle cx="100" cy="50" r="28" fill="#10b981" />
              <rect x="60" y="98" width="80" height="150" rx="15" fill="#10b981" />
              <rect x="68" y="240" width="28" height="140" rx="10" fill="#10b981" />
              <rect x="104" y="240" width="28" height="140" rx="10" fill="#10b981" />
            </g>

            {/* Clickable Anatomical Regions */}
            {activeRegionsList.map((region) => {
              const selected = isAreaSelected(region.id);
              const isHovered = hoveredRegion?.id === region.id;
              const isActive = activeRegion?.id === region.id;

              // Color determination
              let fillColor = 'rgba(203, 213, 225, 0.45)'; // default slate-300
              let strokeColor = '#94a3b8';
              let strokeWidth = '1.5';

              if (selected) {
                const conf = getIntensityConfig(selected.intensity);
                fillColor = conf.color;
                strokeColor = '#ffffff';
                strokeWidth = '2.5';
              } else if (isHovered) {
                fillColor = 'rgba(16, 185, 129, 0.5)';
                strokeColor = '#10b981';
                strokeWidth = '2';
              }

              return (
                <g key={region.id}>
                  <path
                    d={region.d}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="transition-all duration-300 hover:opacity-90"
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => handleRegionClick(region)}
                  />

                  {/* Pulsing selection halo for chosen spots */}
                  {selected && (
                    <g className="pointer-events-none">
                      <circle
                        cx={region.badgePos.x}
                        cy={region.badgePos.y}
                        r="8"
                        fill={getIntensityConfig(selected.intensity).color}
                        className="animate-ping opacity-75"
                      />
                      <circle
                        cx={region.badgePos.x}
                        cy={region.badgePos.y}
                        r="6"
                        fill="#ffffff"
                        stroke={getIntensityConfig(selected.intensity).color}
                        strokeWidth="2"
                      />
                      <circle
                        cx={region.badgePos.x}
                        cy={region.badgePos.y}
                        r="2.5"
                        fill={getIntensityConfig(selected.intensity).color}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Quick Helper Text */}
          <span className="text-[11px] text-slate-400 mt-3 text-center">
            Click any highlighted body section to log or adjust pain intensity.
          </span>
        </div>

        {/* Right Panel: Active Selected Region Settings & Pain List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Area Modifier Card (when an area is selected) */}
          {activeRegion ? (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-5 border border-emerald-500/30 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {activeRegion.label}
                  </h4>
                  {activeRegion.redFlagKey && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Critical Zone
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveArea(activeRegion.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>

              {/* 1. Pain Intensity Selector */}
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Pain Severity Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PAIN_INTENSITIES.map(pi => (
                    <button
                      key={pi.value}
                      type="button"
                      onClick={() => handleUpdateActiveArea({ intensity: pi.value })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        activeRegion.intensity === pi.value
                          ? `${pi.bg} ${pi.border} ${pi.text} ring-2 ring-emerald-500/30`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{pi.label}</span>
                      {activeRegion.intensity === pi.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Pain Quality / Nature */}
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  How does the pain feel?
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAIN_QUALITIES.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleUpdateActiveArea({ quality: q })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        activeRegion.quality === q
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Common Associated Presentations */}
              {activeRegion.commonSymptoms?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-emerald-500/10">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Common Associated Symptoms:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRegion.commonSymptoms.map(sym => (
                      <span
                        key={sym}
                        className="px-2.5 py-1 bg-white/80 dark:bg-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Body Region Selected
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Tap on any anatomical area in the illustration (such as Chest, Upper Abdomen, Head, or Lower Back) to specify severity and pain type.
              </p>
            </div>
          )}

          {/* List of All Selected Pain Areas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Documented Pain Regions ({selectedAreas.length})
              </h4>
              {selectedAreas.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedAreas([]); setActiveRegion(null); notifyParent([]); }}
                  className="text-xs text-slate-400 hover:text-rose-500 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedAreas.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pain zones documented yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedAreas.map((area) => {
                  const conf = getIntensityConfig(area.intensity);
                  const isCurrent = activeRegion?.id === area.id;

                  return (
                    <div
                      key={area.id}
                      onClick={() => setActiveRegion(area)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: conf.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {area.label}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {conf.label} • {area.quality}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveArea(area.id); }}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
