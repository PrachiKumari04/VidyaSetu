import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FlaskConical, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  User, 
  Stethoscope, 
  Search, 
  Check, 
  X,
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_URL } from '../config/api';

export default function LabDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Result entry form state
  const [resultValue, setResultValue] = useState('');
  const [unit, setUnit] = useState('mg/dL');
  const [referenceRange, setReferenceRange] = useState('70 - 100 mg/dL');
  const [notes, setNotes] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);

  const fetchLabOrders = async () => {
    try {
      const res = await axios.get(`${API_URL.replace('/api', '')}/api/lab-orders/pending`);
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabOrders();
  }, []);

  const handleSelectOrder = (order) => {
    setActiveOrder(order);
    setSampleBarcode(`SMP-${order.orderId.substring(order.orderId.length - 6).toUpperCase()}`);
    setResultValue('');
    setNotes('');
    setIsAbnormal(false);

    // Auto-fill typical reference units based on test name
    if (order.testName.toLowerCase().includes('cbc') || order.testName.toLowerCase().includes('hemoglobin')) {
      setUnit('g/dL');
      setReferenceRange('13.0 - 17.0 g/dL');
    } else if (order.testName.toLowerCase().includes('glucose') || order.testName.toLowerCase().includes('sugar')) {
      setUnit('mg/dL');
      setReferenceRange('70 - 100 mg/dL (Fasting)');
    } else if (order.testName.toLowerCase().includes('creatinine')) {
      setUnit('mg/dL');
      setReferenceRange('0.7 - 1.3 mg/dL');
    } else {
      setUnit('mg/dL');
      setReferenceRange('Normal');
    }
  };

  const handleCollectSample = async () => {
    if (!activeOrder) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL.replace('/api', '')}/api/lab-orders/${activeOrder.encounterId}/order/${activeOrder.orderId}/sample`,
        { sampleBarcode }
      );
      if (res.data?.success) {
        alert(`Sample barcode ${sampleBarcode} verified & collected!`);
        fetchLabOrders();
        setActiveOrder(prev => prev ? { ...prev, status: 'collected' } : null);
      }
    } catch (err) {
      alert('Error collecting sample: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!activeOrder || !resultValue) {
      alert('Please enter a test result value.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL.replace('/api', '')}/api/lab-orders/${activeOrder.encounterId}/order/${activeOrder.orderId}/results`,
        {
          resultValue,
          unit,
          referenceRange,
          notes,
          isAbnormal
        }
      );

      if (res.data?.success) {
        alert('Lab test results certified & linked directly to patient clinical record!');
        setActiveOrder(null);
        fetchLabOrders();
      }
    } catch (err) {
      alert('Error submitting result: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCollection = orders.filter(o => o.status === 'ordered');
  const inProcessing = orders.filter(o => o.status === 'collected' || o.status === 'processing');
  const completed = orders.filter(o => o.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      
      {/* ── TOP LAB HEADER ── */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-600/30 rounded-xl text-purple-400 border border-purple-500/30">
              <FlaskConical className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              MediKiosk Pathology & Diagnostic Lab Station
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 tracking-tight">
            Laboratory Workorders & Specimen Analysis
          </h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Scan specimen barcodes, process clinical samples ordered during OPD consultations, and certify test results.
          </p>
        </div>

        <button
          onClick={fetchLabOrders}
          className="p-3 bg-purple-900/60 hover:bg-purple-800 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold shrink-0 border border-purple-700/50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Lab Queue</span>
        </button>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Awaiting Sample</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCollection.length}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400/40" />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">In Processing</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{inProcessing.length}</span>
          </div>
          <FlaskConical className="w-8 h-8 text-blue-400/40" />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Completed Today</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completed.length}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Orders Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between mb-4">
              <span>Incoming Lab Orders</span>
              <span className="text-xs px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold rounded-full">
                {orders.length} total
              </span>
            </h2>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No lab orders in queue.</p>
                <p className="text-[11px] text-slate-500 mt-1">Orders placed by doctors in OPD consultations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {orders.map((o) => {
                  const isSelected = activeOrder?.orderId === o.orderId;
                  return (
                    <div
                      key={o.orderId}
                      onClick={() => handleSelectOrder(o)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-purple-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{o.testName}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : o.status === 'collected'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Patient: <strong>{o.patientName}</strong> ({o.age}y, {o.gender || 'M'})
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Ordered by: {o.doctorName}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Specimen QR & Result Entry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeOrder ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* Order Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Active Specimen Processing
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeOrder.testName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong>{activeOrder.patientName}</strong> ({activeOrder.age}y) | ID: <code>{activeOrder.patientId.substring(0, 10)}...</code>
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  activeOrder.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  {activeOrder.status}
                </span>
              </div>

              {/* Step A: Specimen Collection & QR Code Barcode */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-purple-500" />
                      Step 1: Specimen Barcode & Sample Collection
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Barcode Tag: <strong className="font-mono text-purple-600 dark:text-purple-400">{sampleBarcode}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Instructions: {activeOrder.instructions}
                    </p>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                    <QRCodeSVG value={sampleBarcode} size={64} />
                  </div>
                </div>

                {activeOrder.status === 'ordered' && (
                  <button
                    onClick={handleCollectSample}
                    disabled={submitting}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Specimen Collected</span>
                  </button>
                )}
              </div>

              {/* Step B: Result Entry Form */}
              <form onSubmit={handleSubmitResults} className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Step 2: Clinical Result Values & Certification
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Result Numerical / Qualitative Value
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., 14.2 or 118"
                      value={resultValue}
                      onChange={e => setResultValue(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., mg/dL, g/dL, %"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Biological Reference Range
                    </label>
                    <input
                      type="text"
                      value={referenceRange}
                      onChange={e => setReferenceRange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isAbnormal}
                        onChange={e => setIsAbnormal(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className={isAbnormal ? 'text-red-600 font-black' : ''}>
                        Flag Result as Abnormal / Out-of-Range
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pathologist Clinical Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Mild microcytic hypochromic picture observed; recommend serum ferritin test."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-sm shadow-lg shadow-purple-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Certify Lab Results & Record to Patient EMR</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-500" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                No Lab Workorder Selected
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select an order from the list on the left to collect specimen, view barcode, or record laboratory test results.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
