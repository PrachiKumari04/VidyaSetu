import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, TrendingUp, TrendingDown, Shield, AlertTriangle, Lightbulb, 
  Info, ChevronDown, ChevronUp, ChevronRight, Activity, Coffee, Star, Leaf,
  CheckCircle, ArrowRight, Heart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RiskDetailModal = ({ isOpen, onClose, diseaseId, score, details, userProfile, loading, onOpenQuestionnaire }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('calculation'); // 'calculation' or 'mitigation'
  const [expandedStep, setExpandedStep] = useState(null);

  if (!isOpen) return null;

  // Debug logging
  console.log('[RiskDetailModal] Props:', {
    diseaseId,
    score,
    hasDetails: !!details,
    loading,
    factorBreakdown: details?.factorBreakdown?.length || 0,
    protectiveFactors: details?.protectiveFactors?.length || 0,
    mitigationSteps: details?.mitigationSteps?.length || 0
  });

  const getRiskColor = (score) => {
    if (score === -1) return '#6b7280';
    if (score > 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  const getRiskLabel = (score) => {
    if (score === -1) return 'N/A';
    if (score > 70) return 'Elevated';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getRiskGuidance = (score) => {
    if (score === -1) return 'Missing baseline inputs';
    if (score > 70) return 'Recommend assessment';
    if (score >= 40) return 'Consider screening';
    return 'Low risk';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dietary': return <Coffee className="w-4 h-4" />;
      case 'lifestyle': return <Activity className="w-4 h-4" />;
      case 'monitoring': return <Star className="w-4 h-4" />;
      case 'precaution': return <Shield className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'dietary': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'lifestyle': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'monitoring': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'precaution': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-6 lg:inset-8 bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-[210] flex items-center justify-center"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 font-bold">{t('risk.loading_analysis', { defaultValue: 'Loading risk analysis...' })}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Show error state if details failed to load
  if (!details) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-6 lg:inset-8 bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-[210] flex items-center justify-center"
            >
              <div className="text-center p-8">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-black text-lg mb-2">{t('risk.no_data', { defaultValue: 'No Data Available' })}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {t('risk.no_data_desc', { defaultValue: 'Risk analysis data could not be loaded for' })} {diseaseId?.replace('_', ' ')}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {t('common.close', { defaultValue: 'Close' })}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed inset-4 md:inset-10 lg:inset-16 xl:inset-24 bg-white/80 dark:bg-gray-950/80 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] z-[210] overflow-hidden flex flex-col border border-white/20 dark:border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 md:p-12 border-b border-gray-100 dark:border-white/5 bg-gradient-to-br from-emerald-500/[0.03] to-blue-500/[0.03]">
              <div className="flex items-center gap-6 md:gap-8">
                <div 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center shadow-inner relative group"
                  style={{ backgroundColor: `${getRiskColor(score)}15` }}
                >
                  <div className="absolute inset-0 rounded-[2rem] bg-current opacity-5 animate-pulse" style={{ color: getRiskColor(score) }} />
                  <Activity 
                    className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-500 group-hover:scale-110" 
                    style={{ color: getRiskColor(score) }} 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-1 bg-current rounded-full opacity-20" style={{ color: getRiskColor(score) }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Clinical Intelligence Analysis</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none italic decoration-emerald-500/20">
                    {diseaseId?.replace('_', ' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700">{t('risk.analysis', { defaultValue: 'Risk Analysis' })}</span>
                  </h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm">
                       <span className="text-2xl font-black" style={{ color: getRiskColor(score) }}>{score}%</span>
                       <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
                       <span className="text-xs font-black uppercase tracking-widest text-gray-500">{getRiskLabel(score)} Risk</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 italic">
                      {getRiskGuidance(score)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-4 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all duration-300 hover:rotate-90 group"
              >
                <X className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Sidebar: Navigation & Featured CTA */}
              <div className="w-full md:w-80 border-r border-gray-100 dark:border-white/5 p-8 flex flex-col gap-6 bg-gray-50/30 dark:bg-white/[0.02]">
                
                {/* Segmented Control Tabs */}
                <div className="flex flex-col gap-2 p-2 bg-gray-100/50 dark:bg-white/5 rounded-[2rem] border border-gray-200/50 dark:border-white/5">
                  <button
                    onClick={() => setActiveTab('calculation')}
                    className={`flex items-center gap-4 p-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                      activeTab === 'calculation'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xl shadow-emerald-500/10'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${activeTab === 'calculation' ? 'bg-emerald-500/10 dark:bg-white/20 text-emerald-500 dark:text-white' : 'bg-gray-200 dark:bg-white/5 text-gray-400'}`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    {t('risk.calculation_breakdown', { defaultValue: 'Breakdown' })}
                  </button>
                  <button
                    onClick={() => setActiveTab('mitigation')}
                    className={`flex items-center gap-4 p-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${
                      activeTab === 'mitigation'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xl shadow-emerald-500/10'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${activeTab === 'mitigation' ? 'bg-emerald-500/10 dark:bg-white/20 text-emerald-500 dark:text-white' : 'bg-gray-200 dark:bg-white/5 text-gray-400'}`}>
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    {t('risk.recovery_strategy', { defaultValue: 'Mitigation' })}
                  </button>
                </div>

                {/* Verification Badge */}
                {details?.verification?.source && (
                  <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dataset Verified</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 italic">
                      Calculation powered by <span className="text-emerald-500 underline decoration-emerald-500/20">{details.verification.source}</span> clinical guidelines.
                    </p>
                  </div>
                )}

                {/* Take Detailed Assessment CTA */}
                <div className="mt-auto p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10 space-y-4">
                    <div className="p-3 bg-white/20 rounded-2xl w-fit backdrop-blur-md">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-black leading-tight uppercase tracking-tight">
                      Boost Accuracy <br/>With AI
                    </h4>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-loose opacity-80">
                      Answer {details?.questionnaireLength || '6-8'} clinical inquiries to refine your matrix.
                    </p>
                    <button
                      onClick={onOpenQuestionnaire}
                      className="w-full mt-4 py-4 bg-white text-blue-700 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {t('risk.take_assessment', { defaultValue: 'Begin Analysis' })}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Scrolling Content */}
              <div className="flex-1 overflow-y-auto bg-white/30 dark:bg-transparent">
                <div className="p-8 md:p-14 md:px-16 space-y-12">
                  
                  {activeTab === 'calculation' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-16">
                      
                      {/* Health Matrix Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                              <TrendingUp className="w-4 h-4 text-emerald-500" /> 
                              {t('risk.calculation_breakdown', { defaultValue: 'Predictive Factors' })}
                           </h3>
                           <p className="text-gray-600 dark:text-gray-400 text-lg font-medium leading-relaxed italic">
                              Analyzing {details?.factorBreakdown?.length || 0} risk vectors against {details?.protectiveFactors?.length || 0} protective benchmarks.
                           </p>
                        </div>
                        
                        {userProfile && (
                          <div className="p-8 bg-gray-50/50 dark:bg-white/[0.03] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-wrap gap-4">
                             {[
                               { label: 'Age', val: userProfile.age ? `${userProfile.age} yrs` : null },
                               { label: 'BMI', val: userProfile.bmi },
                               { label: 'Allergies', val: userProfile.allergies?.length > 0 ? `${userProfile.allergies.length}` : null },
                               { label: 'Meds', val: userProfile.activeMedications?.length > 0 ? `${userProfile.activeMedications.length}` : null }
                             ].filter(f => f.val).map(f => (
                               <div key={f.label} className="bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-sm border border-gray-50 dark:border-white/5">
                                  <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">{f.label}</div>
                                  <div className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{f.val}</div>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>

                      {/* Risk Factors Section */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Active Risk Vectors</h3>
                           <div className="px-4 py-1.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20">Impact Analysis</div>
                        </div>
                        
                        {details?.factorBreakdown && details.factorBreakdown.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {details.factorBreakdown.map((factor, idx) => (
                              <motion.div
                                key={factor.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group p-8 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-red-500/20 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6"
                              >
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{factor.name}</h4>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md text-gray-500 group-hover:bg-red-500 group-hover:text-white transition-colors">{factor.category}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-xl">{factor.explanation}</p>
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                                     <span className="flex items-center gap-2"><div className="w-1 h-1 bg-gray-300 rounded-full"/> Current Value: <b className="text-gray-900 dark:text-white">{factor.displayValue}</b></span>
                                  </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-500/10 px-6 py-4 rounded-3xl border border-red-100 dark:border-red-500/20 text-center min-w-[120px]">
                                   <div className="text-[9px] font-black text-red-600/60 uppercase tracking-widest mb-1">Score Delta</div>
                                   <div className="text-2xl font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                                      <TrendingUp className="w-4 h-4" /> +{factor.impact}%
                                   </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                            <Info className="w-12 h-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
                              No specific clinical risk factors detected. <br/> Baseline score of <span className="text-emerald-500">{score}%</span> applies.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Missing Data Matrix */}
                      {details?.missingDataFactors?.length > 0 && (
                        <div className="p-10 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] rounded-[3.5rem] border border-amber-500/10 space-y-8">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div>
                                 <h3 className="text-xl font-black text-amber-700 dark:text-amber-500 uppercase tracking-tighter mb-2">Shadow Metrics Found</h3>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Add {details.missingDataFactors.length} data points to decrease uncertainty gap.</p>
                              </div>
                              <button onClick={onOpenQuestionnaire} className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Resolve Matrix Gap</button>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {details.missingDataFactors.map((factor, idx) => (
                                <div key={idx} className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-amber-500/10 flex items-center gap-4">
                                   <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600"><TrendingUp className="w-4 h-4 opacity-50" /></div>
                                   <div>
                                      <div className="text-[10px] font-black uppercase text-gray-900 dark:text-white leading-none mb-1">{factor.name}</div>
                                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{factor.prompt}</div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Protective Factors Section */}
                      {details.protectiveFactors?.length > 0 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                          <div className="flex items-center justify-between">
                             <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bio-Sovereignty Factors</h3>
                             <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Protective Buffs</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {details.protectiveFactors.map((factor, idx) => (
                              <div key={idx} className="p-6 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.05] border border-emerald-500/10 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                <div>
                                   <h4 className="font-bold text-gray-900 dark:text-white mb-1 uppercase text-xs tracking-tight">{factor.name}</h4>
                                   <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{factor.explanation}</p>
                                </div>
                                <div className="text-emerald-500 font-black text-lg ml-6">-{factor.impact}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Technical Methodology Card */}
                      <div className="p-8 md:p-14 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-[3.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                           <Info className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-8">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white dark:bg-gray-950 rounded-2xl shadow-sm"><Info className="w-6 h-6 text-gray-400" /></div>
                              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter font-italic">Calculation Methodology</h3>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-[0.05em] leading-loose">
                              <div className="space-y-4">
                                 <p className="flex items-center gap-4"><span className="w-6 h-6 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[9px]">01</span> <b>Baseline Risk:</b> Indian population prevalence data (ICMR-INDIAB)</p>
                                 <p className="flex items-center gap-4"><span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-white/5 text-gray-900 dark:text-white rounded-lg text-[9px]">02</span> <b>Vector Weighting:</b> Personalized profile impact ({details.factorBreakdown?.length || 0} factors)</p>
                              </div>
                              <div className="space-y-4">
                                 <p className="flex items-center gap-4"><span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-white/5 text-gray-900 dark:text-white rounded-lg text-[9px]">03</span> <b>Sovereign Buffs:</b> Subtraction of healthy indicators ({details.protectiveFactors?.length || 0} factors)</p>
                                 <p className="flex items-center gap-4"><span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-white/5 text-gray-900 dark:text-white rounded-lg text-[9px]">04</span> <b>Clinical Thresholds:</b> Capped between 2% - 95% for clinical relevance</p>
                              </div>
                           </div>
                           <div className="pt-8 border-t border-gray-100 dark:border-white/5 italic">
                              <p className="text-[10px] text-gray-500">Datasets verified against ICMR-INDIAB 2023, NFHS-5, WHO Guidelines & Harvard Medical School IDRS criteria.</p>
                           </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {activeTab === 'mitigation' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-16">
                      
                      {/* Critical Action Alert */}
                      {details.mitigationSteps?.filter(s => s.priority === 'high').length > 0 && (
                        <div className="space-y-8">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-red-500/10 rounded-2xl"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Immediate Clinical Precautions</h3>
                           </div>
                           <div className="grid grid-cols-1 gap-4">
                            {details.mitigationSteps
                              .filter(s => s.priority === 'high')
                              .map((step, idx) => (
                                <motion.div
                                  key={step.id || idx}
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="p-8 bg-red-600 text-white rounded-[2.5rem] shadow-2xl shadow-red-500/20 relative overflow-hidden group"
                                >
                                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-24 -mt-24" />
                                  <div className="relative z-10 flex gap-6">
                                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shrink-0 h-fit flex items-center justify-center">
                                      <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="text-xl font-black uppercase tracking-tight italic">{step.title}</h4>
                                      <p className="text-sm font-medium text-red-50 leading-relaxed opacity-90">{step.description}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Targeted Recovery Matrix */}
                      <div className="space-y-10">
                        <div className="flex items-center justify-between">
                           <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sovereign Recovery Steps</h3>
                           <div className="px-4 py-1.5 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20">Protocol Matrix</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {details.mitigationSteps?.map((step, idx) => (
                            <motion.div
                              key={step.id || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`group bg-white dark:bg-white/[0.04] border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                                expandedStep === step.id ? 'border-emerald-500 shadow-2xl scale-[1.02]' : 'border-gray-100 dark:border-white/5'
                              }`}
                            >
                              <button
                                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                className="w-full p-8 text-left space-y-6"
                              >
                                <div className="flex justify-between items-start">
                                  <div className={`p-4 rounded-2xl transition-all duration-500 ${getCategoryColor(step.category)} group-hover:scale-110 shadow-sm`}>
                                    {getCategoryIcon(step.category)}
                                  </div>
                                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${getPriorityColor(step.priority)}`}>
                                    {step.priority} Priority
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                                    {step.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed italic">
                                    {step.description}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                   <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:translate-x-1 transition-transform">Explore Protocol</div>
                                   <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-all ${expandedStep === step.id ? 'rotate-90' : ''}`} />
                                </div>
                              </button>

                              <AnimatePresence>
                                {expandedStep === step.id && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-8 pb-8 pt-4 bg-gray-50/50 dark:bg-white/[0.02]"
                                  >
                                    <div className="space-y-6">
                                       <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-loose italic">
                                            "{step.description}"
                                          </p>
                                       </div>
                                       {step.isRegional && (
                                         <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                                           <Leaf className="w-3.5 h-3.5" /> 🇮🇳 Indian Context Strategy Applied
                                         </div>
                                       )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* High-Contrast Clinical Disclaimer */}
                      <div className="p-10 bg-gray-950 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 p-8 opacity-20 pointer-events-none group-hover:translate-y-2 transition-transform">
                           <Shield className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 italic text-amber-400">!</div>
                           <div className="space-y-2 max-w-2xl">
                              <h4 className="text-xl font-black uppercase tracking-tighter">Clinical Disclaimer & Sovereignty</h4>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-loose">
                                These vectors are derived from collective datasets and individual indicators. This analysis serves as screening guidance only and does not constitute a formal diagnosis. Always engage with a licensed practitioner before modulating your bio-regime.
                              </p>
                           </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RiskDetailModal;
