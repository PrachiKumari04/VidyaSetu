import React from 'react';
import { Shield, Lock, FileText, Database, Trash2, Scale } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="w-full max-w-4xl mx-auto text-white animate-in fade-in slide-in-from-bottom-5 duration-700 pb-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-4">
          <Shield className="w-12 h-12 text-blue-500" />
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-lg">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-8">
        {/* Intro */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <p className="text-gray-300 leading-relaxed text-lg">
            Welcome to <span className="font-bold text-white">VaidyaSetu</span>. We are committed to protecting your personal health information. This Privacy Policy outlines how we collect, use, and safeguard your data in compliance with the <span className="text-blue-400 font-medium">Digital Personal Data Protection (DPDP) Act, 2023</span>.
          </p>
        </section>

        {/* Data Collection */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-500" />
            1. Information We Collect
          </h2>
          <ul className="space-y-4 text-gray-400 leading-relaxed">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <p><strong className="text-gray-200">Identity Data:</strong> Name, age, gender, and contact information authenticated securely via Clerk.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <p><strong className="text-gray-200">Health Data:</strong> Prescription scans, uploaded medicine names, and chronic conditions to assess interaction risks.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <p><strong className="text-gray-200">Device/Fitness Data:</strong> Step counts and physical activity levels synced conditionally via Google Fit, solely with your explicit consent.</p>
            </li>
          </ul>
        </section>

        {/* Data Usage */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            2. How We Use Your Data
          </h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Your data is strictly processed to fulfill the core service of VaidyaSetu: predicting disease risks and providing cross-system medicine interaction safety warnings. 
          </p>
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 rounded-xl border border-blue-500/20 text-gray-300">
            <strong>Active Learning:</strong> Feedback provided on AI responses is anonymized and used exclusively to refine our Interaction Engine accuracy.
          </div>
        </section>

        {/* Data Protection */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Lock className="w-6 h-6 text-purple-500" />
            3. Data Protection & Processing
          </h2>
          <p className="text-gray-400 leading-relaxed">
            All data in transit is encrypted using industry-standard TLS protocols. Your sensitive records are safely isolated in MongoDB Atlas. We do not sell your personal data to third parties. Uploaded prescription images are processed ephemerally and are not retained long-term on our servers.
          </p>
        </section>

        {/* User Rights */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl border-l-4 border-l-emerald-500">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Scale className="w-6 h-6 text-emerald-500" />
            4. Your Rights under the DPDP Act
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 p-4 rounded-xl">
              <h3 className="text-white font-bold mb-2">Right to Access</h3>
              <p className="text-gray-400 text-sm">You can view and export all your health data from your Dashboard at any time.</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <h3 className="text-white font-bold mb-2">Right to Erasure</h3>
              <p className="text-gray-400 text-sm">You have the "Right to be Forgotten." Use the "Delete My Data" feature in your dashboard to permanently wipe your profile and assessments.</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <h3 className="text-white font-bold mb-2">Right to Correction</h3>
              <p className="text-gray-400 text-sm">You may update your profile parameters instantly within the application.</p>
            </div>
            <div className="bg-black/30 p-4 rounded-xl">
              <h3 className="text-white font-bold mb-2">Consent Management</h3>
              <p className="text-gray-400 text-sm">You can revoke Google Fit tracking permissions at any time through your Google Account settings.</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <p className="text-gray-400 text-sm text-center">
            If you have questions regarding our privacy practices or wish to exercise your data rights, please contact our Data Protection Officer at <a href="mailto:privacy@vaidyasetu.app" className="text-blue-400 hover:text-blue-300">privacy@vaidyasetu.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
