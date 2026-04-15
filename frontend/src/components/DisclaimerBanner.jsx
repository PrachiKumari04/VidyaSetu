import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const DisclaimerBanner = () => {
  return (
    <footer className="mt-auto py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/5 backdrop-blur-2xl border border-red-500/20 shadow-[0_8px_32px_rgba(239,68,68,0.1)] rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden group hover:border-red-500/30 transition-all duration-500">
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
           <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 relative z-10 shrink-0">
              <AlertTriangle className="w-8 h-8" />
           </div>
           <div className="relative z-10">
              <h4 className="text-gray-900 dark:text-white font-black mb-2 tracking-tight">Medical Disclaimer</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl">
                VaidyaSetu is an AI-powered health assistant designed for educational and screening purposes only. 
                The insights, risk scores, and interaction alerts provided are generated based on clinical databases and the Llama 3 model. 
                They do <strong>not</strong> constitute medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. 
                Never disregard professional medical advice or delay in seeking it because of something you have read on this platform.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 dark:text-gray-600">
                 <Info className="w-3 h-3" /> Powered by Groq Llama 3 & IMPPAT Database
              </div>
           </div>
        </div>
        
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-700 dark:text-gray-300 text-xs font-medium">
           <p>© 2026 VaidyaSetu. Bridge to Balanced Health.</p>
           <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
              <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default DisclaimerBanner;
