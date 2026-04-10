import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Sidebar from './components/Sidebar';
import Onboarding from './pages/Onboarding';
import { Activity } from 'lucide-react';

const DashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
    <div className="card max-w-lg w-full p-12 border-emerald-500/10 bg-gray-900/40 backdrop-blur-xl">
      <div className="p-4 bg-emerald-500/10 rounded-full inline-block mb-6 border border-emerald-500/20">
        <Activity className="w-10 h-10 text-emerald-500" />
      </div>
      <h1 className="text-4xl font-bold mb-4 gradient-text">Health Ecosystem Active</h1>
      <p className="text-gray-400 mb-8">
        Your personalized health bridge is initializing. Phase 1 is now operational.
      </p>
      <div className="flex gap-4 justify-center">
         <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-bold uppercase">
           Monitoring Active
         </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/sign-in" element={<SignedOut><RedirectToSignIn /></SignedOut>} />
        
        {/* Protected Onboarding */}
        <Route path="/onboarding" element={
          <SignedIn>
            <Onboarding />
          </SignedIn>
        } />

        {/* Protected App Routes */}
        <Route path="/*" element={
          <SignedIn>
            <div className="flex flex-col md:flex-row min-h-screen w-full transition-colors duration-500">
              <Sidebar />
              <main className="flex-1 p-4 sm:p-8 md:p-12 w-full overflow-auto">
                <Routes>
                  <Route path="/" element={<DashboardPlaceholder />} />
                </Routes>
              </main>
            </div>
          </SignedIn>
        } />

        {/* Fallback */}
        <Route path="*" element={<SignedOut><RedirectToSignIn /></SignedOut>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
