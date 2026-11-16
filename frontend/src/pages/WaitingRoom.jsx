import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Bell } from 'lucide-react';
import { API_URL } from '../config/api';

export default function WaitingRoom() {
  const { user } = useUser();
  const patientId = user?.id || 'guest_patient_001';

  const [token, setToken] = useState(null);
  const [calledAlert, setCalledAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveToken = async () => {
    try {
      const res = await axios.get(`${API_URL.replace('/api', '')}/api/queue/patient/${patientId}/current`);
      if (res.data?.success) {
        setToken(res.data.token);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveToken();

    // Connect Real-Time WebSocket
    const socket = io(API_URL.replace('/api', ''), { transports: ['websocket'] });

    socket.emit('join:patient', patientId);

    // Live update when queue changes or doctor calls patient
    socket.on('queue:updated', () => {
      fetchActiveToken();
    });

    socket.on('patient:called', (payload) => {
      if (payload.patientId === patientId) {
        setCalledAlert(payload);
        fetchActiveToken();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Real-time Called Flash Banner */}
      {calledAlert && (
        <div className="mb-6 p-6 bg-emerald-500 text-white rounded-3xl shadow-xl animate-bounce flex items-center gap-4">
          <Bell className="w-10 h-10" />
          <div>
            <h3 className="text-xl font-bold">Please Proceed to Consultation Room!</h3>
            <p className="text-sm opacity-90">
              Doctor is ready to review your case for Token <strong>{calledAlert.tokenNumber}</strong>.
            </p>
          </div>
        </div>
      )}

      {token ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Live Connected (WebSocket)
            </span>
            <button
              onClick={fetchActiveToken}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              token.priority === 'emergency' 
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {token.priority} Priority
            </span>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white mt-3">
              {token.tokenNumber}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Assigned to: <strong>{token.doctorName}</strong> ({token.departmentId})
            </p>
          </div>

          {/* QR Code Presentation */}
          {token.qrCode && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 inline-block rounded-2xl border border-slate-200 dark:border-slate-700">
              <img src={token.qrCode} alt="Token QR" className="w-40 h-40 mx-auto" />
            </div>
          )}

          {/* Live Position & Dynamic ETA */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Queue Position</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {token.status === 'called' ? 'NOW' : `#${token.position}`}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estimated Wait</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {token.status === 'called' ? '0 min' : `~${token.estimatedWaitMinutes}m`}
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-left">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              ℹ️ <strong>Dynamic ETA Advisory:</strong> Estimated waiting time updates automatically as doctor concludes prior consultations or if an emergency case is escalated.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">No Active Queue Token</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            You do not currently have a waiting consultation token. Please complete clinical intake first.
          </p>
        </div>
      )}
    </div>
  );
}
