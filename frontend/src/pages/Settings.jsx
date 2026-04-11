import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const Settings = () => {
  const { user } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data?.status === 'success') {
            setProfileData(res.data.data);
            setName(res.data.data?.name?.value || '');
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      // Re-map the name field to the existing nested object architecture
      const payload = {
        clerkId: user.id,
        name: name.trim()
      };

      const res = await axios.post(`${API_URL}/user/profile`, payload);
      
      if (res.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center">
           <SettingsIcon className="w-8 h-8 mr-3 text-emerald-500" /> System Settings
        </h1>
        <p className="text-gray-500 mt-2 font-medium italic">
          Manage your platform identity and account preferences.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Personal Identity</h2>
        
        <div className="space-y-6 max-w-xl relative w-full z-10">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-emerald-500" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
              placeholder="e.g. Rahul Sharma"
            />
            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide font-bold">This name appears on your dashboard and medical reports.</p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {success ? (
               <div className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-500/10 px-4 py-2 rounded-lg animate-in zoom-in">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Identity Updated
               </div>
            ) : <div/>}

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center group"
            >
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
