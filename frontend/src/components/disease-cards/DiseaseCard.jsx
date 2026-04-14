import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, TrendingUp, Info, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, ExternalLink, Lightbulb } from 'lucide-react';
import axios from 'axios';
import DiseaseCardSkeleton from './DiseaseCardSkeleton';
import CalculationBreakdown from './CalculationBreakdown';
import InCardDataCollection from './InCardDataCollection';
import FrequencySlider from './inputs/FrequencySlider';
import DatePicker from './inputs/DatePicker';
import MitigationSteps from './MitigationSteps';
import DoctorConsultation from './DoctorConsultation';
import EmergencyBanner from './EmergencyBanner';
import CalculationModal from './CalculationModal';
import MitigationModal from './MitigationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const DiseaseCard = ({ diseaseId, initialScore, isExpanded, onToggle, clerkId, profile }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' or 'down'
  const [isPulsing, setIsPulsing] = useState(false); // For score updates
  const [dataSnapshot, setDataSnapshot] = useState(null); // Step 39: Snapshot for Undo
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showMitigationModal, setShowMitigationModal] = useState(false);

  useEffect(() => {
    if (isExpanded && !details && !loading) {
      fetchDetails();
      trackEvent('card_expand', { diseaseId });
    }
  }, [isExpanded]);

  const trackEvent = async (event, meta = {}) => {
    try {
      await axios.post(`${API_URL}/analytics/track`, {
        clerkId,
        event,
        diseaseId,
        metadata: { ...meta, timestamp: new Date() }
      });
    } catch (err) {
      console.warn('Analytics tracking failed');
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[DiseaseCard] Fetching details for:', diseaseId, 'clerkId:', clerkId);
      const res = await axios.get(`${API_URL}/diseases/${diseaseId}/details`, {
        params: { clerkId }
      });
      console.log('[DiseaseCard] Response:', res.data.status, res.data.message || '');
      if (res.data.status === 'success') {
        const data = res.data.data;
        setDetails(data);
        setIsReviewed(!!data.reviewedAt);
      } else {
        setError(res.data.message || 'Failed to load clinical baseline.');
      }
    } catch (err) {
      console.error('[DiseaseCard] Fetch disease details error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.message || err.message || 'Technical error: Could not load clinical baseline.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleReview = async () => {
    try {
      const newStatus = !isReviewed;
      setIsReviewed(newStatus);
      if (newStatus) {
        await axios.patch(`${API_URL}/diseases/${diseaseId}/review`, { clerkId });
      }
    } catch (err) {
      console.error('Review update failed:', err);
    }
  };

  const handleFeedback = async (rating) => {
    setFeedback(rating);
    try {
      await axios.post(`${API_URL}/feedback`, {
        clerkId,
        context: `${diseaseId}_card`,
        rating,
        query: 'Disease Details Exploration',
        response: details.riskCategory
      });
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const handleDataSubmit = async (formData) => {
    setLoading(true);
    // Step 39: Capture snapshot of current values for these fields if they exist
    const snapshot = {};
    Object.keys(formData).forEach(key => {
      snapshot[key] = (details?.rawInputData?.[key]?.value !== undefined) 
        ? details.rawInputData[key].value 
        : details?.rawInputData?.[key];
    });
    setDataSnapshot(snapshot);

    try {
      const res = await axios.post(`${API_URL}/diseases/${diseaseId}/add-data`, {
        clerkId,
        data: formData
      });
      if (res.data.status === 'success') {
        const newData = res.data.data;
        setDetails(newData);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000); // Pulse for 2s
        
        // Notify parent with Undo capability
        if (window.onHealthDataUpdate) {
          window.onHealthDataUpdate(diseaseId, () => handleUndo(snapshot));
        }
      }
    } catch (err) {
      console.error('Data submission failed:', err);
      setError('Failed to update clinical metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (snapshot) => {
    if (!snapshot) return;
    setLoading(true);
    try {
      // Revert to snapshot values
      const res = await axios.post(`${API_URL}/diseases/${diseaseId}/add-data`, {
        clerkId,
        data: snapshot
      });
      if (res.data.status === 'success') {
        setDetails(res.data.data);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score === -1) return '#6b7280';
    if (score >= 76) return '#ef4444'; // Very High
    if (score >= 51) return '#f59e0b'; // High
    if (score >= 26) return '#f59e0b'; // Moderate (Using amber)
    return '#10b981'; // Low/Very Low
  };

  const getRiskLabel = (score) => {
    if (score === -1) return 'N/A';
    if (score >= 76) return 'Very High';
    if (score >= 51) return 'High';
    if (score >= 26) return 'Moderate';
    if (score >= 5) return 'Low';
    return 'Very Low';
  };

  return (
    <motion.div 
      layout
      transition={{ layout: { duration: 0.4, type: 'spring', damping: 25, stiffness: 120 } }}
      className={`bg-white dark:bg-gray-950 border ${isExpanded ? 'border-emerald-500/30 ring-1 ring-emerald-500/10 shadow-2xl z-10' : 'border-gray-100 dark:border-gray-800 shadow-sm'} p-5 rounded-[2rem] transition-all hover:border-emerald-500/20 w-full relative overflow-hidden group`}
    >
      {/* Collapsed Header */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Circular Progress Indicator */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke={initialScore === -1 ? '#6b7280' : getRiskColor(initialScore)}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={125.6}
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 - (125.6 * (initialScore === -1 ? 0 : initialScore)) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <AlertCircle className={`w-5 h-5 ${isExpanded ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'}`} />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
              {diseaseId.replace('_', ' ')}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
              {getRiskLabel(initialScore)} Risk
              {isReviewed && <CheckCircle2 className="w-3.5 h-3.5 ml-2 text-emerald-500" />}
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <motion.div 
              animate={isPulsing ? { scale: [1, 1.2, 1], color: ['#6b7280', '#10b981', getRiskColor(initialScore)] } : {}}
              className={`text-2xl font-black ${initialScore === -1 ? 'text-gray-500' : ''}`} 
              style={{ color: initialScore !== -1 ? getRiskColor(initialScore) : undefined }}
            >
              {initialScore === -1 ? 'N/A' : `${initialScore}%`}
            </motion.div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {loading ? (
              <DiseaseCardSkeleton />
            ) : error ? (
              <div className="pt-6 text-center">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchDetails} className="mt-4 text-xs font-bold text-emerald-500 underline uppercase tracking-widest">Retry Connection</button>
              </div>
            ) : details ? (
              <div className="pt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                {/* Step 58: Emergency Banner */}
                {details.emergencyAlerts && details.emergencyAlerts.length > 0 && (
                  details.emergencyAlerts.map(alert => (
                    <EmergencyBanner 
                      key={alert.id} 
                      alert={alert} 
                      onTrackCall={(id, phone) => trackEvent('call_108_click', { alertId: id, phone })}
                    />
                  ))
                )}

                {/* Step 60 Components Hierarchy */}
                
                {/* 1. Data Completeness Indicator */}
                <div className="space-y-4">
                  <div className="space-y-2 relative group/completeness">
                     <div className="flex justify-between items-end">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Calculation Confidence</span>
                          <div className="relative">
                             <Info className="w-3 h-3 text-gray-400 cursor-help" />
                             <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-gray-900 text-[10px] text-white rounded-xl opacity-0 group-hover/completeness:opacity-100 transition-opacity z-50 shadow-2xl pointer-events-none">
                                <p className="font-bold mb-1 border-b border-white/10 pb-1">Clinical Requirements:</p>
                                {details.missingDataFactors.length > 0 ? (
                                  details.missingDataFactors.map(f => <div key={f.id} className="mt-1 opacity-80">• {f.name}</div>)
                                ) : (
                                  <div className="text-emerald-400">Assessment fully optimized.</div>
                                )}
                             </div>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${details.dataCompleteness >= 90 ? 'text-emerald-500' : details.dataCompleteness >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {details.dataCompleteness}% Complete
                        </span>
                     </div>
                     <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${details.dataCompleteness}%` }}
                          className="h-full rounded-full transition-colors duration-500"
                          style={{ backgroundColor: details.dataCompleteness >= 90 ? '#10b981' : details.dataCompleteness >= 60 ? '#f59e0b' : '#ef4444' }}
                        />
                     </div>
                  </div>
                </div>

                {/* 2. Missing Data Section with Inline Forms (Step 32/33 / 1.3) */}
                {details.missingDataFactors && details.missingDataFactors.length > 0 && (
                  <div className="bg-gray-50/50 dark:bg-gray-900/20 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                    <InCardDataCollection 
                      missingFactors={details.missingDataFactors} 
                      onSubmit={(data) => {
                        trackEvent('missing_data_add', { fields: Object.keys(data) });
                        handleDataSubmit(data);
                      }}
                      loading={loading}
                    />
                  </div>
                )}

                {/* 3. Calculation Breakdown - Now a Popup Trigger */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCalculationModal(true)}
                    className="w-full p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-200 dark:border-blue-800/30 rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            View Calculation Breakdown
                          </h5>
                          <p className="text-xs text-gray-500 mt-0.5">
                            See how your {details.riskScore}% risk is calculated
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>

                  {/* Compact Summary */}
                  <div className="bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>{details.factorBreakdown.length}</strong> risk factors • 
                      <strong> {details.protectiveFactors.length}</strong> protective factors • 
                      Click above for full details
                    </p>
                  </div>
                </div>

                {/* 4. Risk Explanation Summary (Step 34) */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center">
                    <Info className="w-3 h-3 mr-2" /> Clinical Interpretation
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Based on your profile, your {diseaseId.replace('_', ' ')} risk is {details.riskCategory.toLowerCase()} at {details.riskScore}%. 
                    This calculation incorporates {details.factorBreakdown.length} active risk factors 
                    {details.factorBreakdown.length > 0 ? ` (led by ${details.factorBreakdown[0].name})` : ''} 
                    {details.protectiveFactors.length > 0 ? ` and ${details.protectiveFactors.length} protective lifestyle markers.` : '.'}
                  </p>
                </div>

                {/* 5. Mitigation Steps - Now a Popup Trigger */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowMitigationModal(true)}
                    className="w-full p-5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            View Recovery Strategy & Precautions
                          </h5>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {details.mitigationSteps?.length || 0} personalized steps including precautions
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </button>

                  {/* Quick Preview */}
                  {details.mitigationSteps?.length > 0 && (
                    <div className="bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Top Priority:</strong> {details.mitigationSteps[0].title}
                      </p>
                      <div className="flex gap-2">
                        {details.mitigationSteps.slice(0, 3).map((step, idx) => (
                          <span 
                            key={idx}
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                              step.priority === 'high' ? 'bg-red-500 text-white' :
                              step.priority === 'medium' ? 'bg-amber-500 text-white' :
                              'bg-emerald-500 text-white'
                            }`}
                          >
                            {step.priority}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Doctor Consultation & Finder (Step 46/49) */}
                <DoctorConsultation 
                  triggers={details.consultationTriggers}
                  diseaseName={diseaseId}
                  riskScore={details.riskScore}
                  profile={details.rawInputData}
                  profileSettings={profile?.settings}
                  clerkId={clerkId}
                />

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800 gap-4">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => {
                        toggleReview();
                        trackEvent('mark_as_reviewed');
                      }}
                      className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${isReviewed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {isReviewed ? <BookmarkCheck className="w-4 h-4 mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                      {isReviewed ? 'Insight Reviewed' : 'Mark as Reviewed'}
                    </button>
                    <div className="text-[10px] text-gray-400 underline decoration-gray-300/50 cursor-help">
                       Sources: {details.diseaseMetadata.sources.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Helpful?</span>
                    <button 
                      onClick={() => {
                        handleFeedback('up');
                        trackEvent('feedback_submission', { rating: 'up' });
                      }} 
                      className={`p-2 rounded-lg transition-all ${feedback === 'up' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-emerald-50 text-gray-400'}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        handleFeedback('down');
                        trackEvent('feedback_submission', { rating: 'down' });
                      }} 
                      className={`p-2 rounded-lg transition-all ${feedback === 'down' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'hover:bg-red-50 text-gray-400'}`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Modals */}
      <CalculationModal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        factors={details?.factorBreakdown || []}
        protective={details?.protectiveFactors || []}
        finalScore={details?.riskScore || 0}
        diseaseId={diseaseId}
      />

      <MitigationModal
        isOpen={showMitigationModal}
        onClose={() => setShowMitigationModal(false)}
        steps={details?.mitigationSteps || []}
        userProfile={details?.userProfile}
        diseaseId={diseaseId}
      />
    </motion.div>
  );
};

export default DiseaseCard;
