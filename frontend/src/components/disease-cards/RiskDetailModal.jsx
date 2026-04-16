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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[95%] md:max-w-4xl md:max-h-[90vh] bg-white/95 dark:bg-gray-950/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/10 z-[210] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-5 md:p-8 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500" style={{ backgroundImage: `radial-gradient(circle at top right, ${getRiskColor(score)}, transparent 50%)` }} />
              <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0 pr-2">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${getRiskColor(score)}20` }}
                >
                  <Activity 
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" 
                    style={{ color: getRiskColor(score) }} 
                  />
                </div>
                <div className="flex-1 min-w-0 mt-0.5 md:mt-0">
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white capitalize leading-tight break-words">
                    {diseaseId?.replace('_', ' ')} {t('risk.analysis', { defaultValue: 'Analysis' })}
                  </h2>
                  <p className="mt-1 md:mt-1.5 text-xs md:text-sm font-bold text-gray-500 leading-snug break-words">
                    <span 
                      className="text-lg md:text-2xl font-black mr-1.5"
                      style={{ color: getRiskColor(score) }}
                    >
                      {score}%
                    </span>
                    <span className="align-middle">• {getRiskLabel(score)} Risk - {getRiskGuidance(score)}</span>
                  </p>
                  {details?.verification?.source && (
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-1.5">
                      Verified: {details.verification.source}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-xl transition-colors shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Take Detailed Assessment Button */}
            <div className="px-6 md:px-8 mt-6">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900/80 dark:to-indigo-900/80 rounded-3xl border border-blue-400 dark:border-blue-500/30 shadow-xl shadow-blue-500/20 relative overflow-hidden group"
              >
                <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                <div className="flex flex-wrap items-center justify-between gap-6 relative z-10 w-full">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-black text-white text-lg lg:text-xl leading-tight">
                        {t('risk.get_accurate_score', { defaultValue: 'Get More Accurate Risk Score' })}
                      </h4>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed pr-2">
                      Answer <span className="font-bold text-white">{details?.questionnaireLength || '6-8'}</span> targeted questions about <span className="font-bold text-white">{diseaseId?.replace('_', ' ')}</span>. 
                      We'll combine your answers with your existing health data for a comprehensive assessment.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-white/90 font-medium">
                      <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                        Personalized
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-300" />
                        Evidence-based
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-300" />
                        2-3 mins
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenQuestionnaire}
                    className="w-full sm:w-auto px-6 py-4 md:py-3.5 bg-white hover:bg-gray-50 text-blue-600 text-sm font-black rounded-xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-center items-center gap-2 shrink-0 md:ml-4"
                  >
                    {t('risk.take_assessment', { defaultValue: 'Take Assessment' })}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
            </motion.div>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-6 md:px-8 border-b border-gray-100 dark:border-white/5 mt-6 gap-6">
              <button
                onClick={() => setActiveTab('calculation')}
                className={`pb-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'calculation'
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                {t('risk.calculation_breakdown', { defaultValue: 'Calculation Breakdown' })}
              </button>
              <button
                onClick={() => setActiveTab('mitigation')}
                className={`pb-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'mitigation'
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
                }`}
              >
                <Lightbulb className="w-4 h-4 inline mr-2" />
                {t('risk.recovery_strategy', { defaultValue: 'Recovery Strategy' })}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'calculation' && (
                <div className="p-6 md:p-8 space-y-8">
                  {/* User Profile Considerations */}
                  {userProfile && (userProfile.allergies?.length > 0 || userProfile.activeMedications?.length > 0) && (
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                      <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Your Profile Factors
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {userProfile.allergies?.length > 0 && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                            <div className="text-xs font-bold text-gray-500 mb-1">Allergies</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">{userProfile.allergies.length} known</div>
                          </div>
                        )}
                        {userProfile.activeMedications?.length > 0 && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                            <div className="text-xs font-bold text-gray-500 mb-1">Medications</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">{userProfile.activeMedications.length} active</div>
                          </div>
                        )}
                        {userProfile.age && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                            <div className="text-xs font-bold text-gray-500 mb-1">Age</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">{userProfile.age} years</div>
                          </div>
                        )}
                        {userProfile.bmi && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                            <div className="text-xs font-bold text-gray-500 mb-1">BMI</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">{userProfile.bmi}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
                      Risk Factors ({details?.factorBreakdown?.length || 0})
                    </h3>
                    
                    {details?.factorBreakdown && details.factorBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        {details.factorBreakdown.map((factor, idx) => (
                          <motion.div
                            key={factor.id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                      {factor.name}
                                    </h4>
                                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 rounded-lg">
                                      {factor.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center font-black text-xl text-red-500">
                                    <TrendingUp className="w-5 h-5 mr-1" />
                                    +{factor.impact}%
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                  {factor.explanation}
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                  <span className="text-xs font-bold text-gray-500">Value:</span> 
                                  <span className="text-sm font-black text-gray-900 dark:text-white">{factor.displayValue}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          <Info className="w-5 h-5 inline mr-2" />
                          No specific risk factors detected. Your score of <strong>{score}%</strong> is based on baseline population data.
                        </p>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Complete your health profile to get personalized risk factor analysis.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Missing Data Prompts */}
                  {details?.missingDataFactors?.length > 0 && (
                    <div className="p-5 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                            Missing Data ({details.missingDataFactors.length})
                          </h3>
                          <p className="text-xs text-amber-700/90 dark:text-amber-300 mb-3">
                            Add these fields to improve prediction quality:
                          </p>
                          <div className="space-y-2">
                            {details.missingDataFactors.slice(0, 5).map((factor, idx) => (
                              <div key={factor.id || idx} className="text-xs text-gray-700 dark:text-gray-300">
                                • {factor.name}: {factor.prompt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={onOpenQuestionnaire}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-colors whitespace-nowrap"
                        >
                          Fill Missing Data
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Protective Factors */}
                  {details.protectiveFactors?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-emerald-500" />
                        Protective Factors ({details.protectiveFactors.length})
                      </h3>
                      <div className="space-y-3">
                        {details.protectiveFactors.map((factor, idx) => (
                          <div
                            key={factor.id || idx}
                            className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                  {factor.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {factor.explanation}
                                </p>
                              </div>
                              <div className="ml-4 text-emerald-500 font-black text-lg">
                                -{factor.impact}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calculation Methodology */}
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-500" />
                      How is this calculated?
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><strong>1. Baseline Risk:</strong> Indian population prevalence data (ICMR-INDIAB)</p>
                      <p><strong>2. Risk Factors:</strong> Added based on your profile ({details.factorBreakdown?.length || 0} factors)</p>
                      {details.protectiveFactors?.length > 0 && (
                        <p><strong>3. Protective Factors:</strong> Subtracted for healthy behaviors ({details.protectiveFactors.length} factors)</p>
                      )}
                      <p><strong>4. Final Score:</strong> Capped between 2-95% for clinical relevance</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <strong>Data Sources:</strong> ICMR-INDIAB 2023, NFHS-5, WHO Guidelines, IDRS
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'mitigation' && (
                <div className="p-6 md:p-8 space-y-8">
                  {/* User Profile Considerations */}
                  {userProfile && (
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                      <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Considering Your Profile
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {userProfile.allergies?.length > 0 && (
                          <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Allergies</p>
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                              {userProfile.allergies.join(', ')}
                            </p>
                          </div>
                        )}
                        {userProfile.activeMedications?.length > 0 && (
                          <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Medications</p>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                              {userProfile.activeMedications.map(m => m.name).join(', ')}
                            </p>
                          </div>
                        )}
                        {userProfile.age && (
                          <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Age</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{userProfile.age} yrs</p>
                          </div>
                        )}
                        {userProfile.bmi && (
                          <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">BMI</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{userProfile.bmi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Critical Precautions */}
                  {details.mitigationSteps?.filter(s => s.priority === 'high').length > 0 && (
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                        Critical Precautions
                      </h3>
                      <div className="space-y-3">
                        {details.mitigationSteps
                          .filter(s => s.priority === 'high')
                          .map((step, idx) => (
                            <div
                              key={step.id || idx}
                              className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-500 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                    {step.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* All Mitigation Steps */}
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                      All Recovery Steps
                    </h3>
                    <div className="space-y-3">
                      {details.mitigationSteps?.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors"
                        >
                          <button
                            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                            className="w-full p-4 text-left flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`p-2 rounded-lg ${getCategoryColor(step.category)}`}>
                                {getCategoryIcon(step.category)}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(step.priority)}`}>
                                    {step.priority}
                                  </span>
                                  <h4 className="font-bold text-gray-900 dark:text-white">
                                    {step.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                            <ArrowRight 
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedStep === step.id ? 'rotate-90' : ''
                              }`} 
                            />
                          </button>

                          <AnimatePresence>
                            {expandedStep === step.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-4 pb-4 px-12 border-t border-gray-100 dark:border-gray-800/50 mt-2 pt-4"
                              >
                                <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3 ${getCategoryColor(step.category)}`}>
                                  {getCategoryIcon(step.category)}
                                  <span className="ml-2">{step.category}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                                  {step.description}
                                </p>
                                {step.isRegional && (
                                  <div className="mt-3 inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                                    🇮🇳 Indian Context Applied
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medical Disclaimer */}
                  <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Medical Disclaimer:</strong> These recommendations are based on clinical guidelines and your health profile. 
                      Always consult with a qualified healthcare provider before making significant changes to your treatment plan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RiskDetailModal;
