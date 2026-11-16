import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

// MediKiosk First-Mile Clinical Pages
import PatientIntake from './pages/PatientIntake';
import WaitingRoom from './pages/WaitingRoom';
import DoctorDashboard from './pages/DoctorDashboard';
import ConsentSettings from './pages/ConsentSettings';

// Retained Supporting Clinical Pages
import Dashboard from './pages/Dashboard';
import HealthProfile from './pages/HealthProfile';
import ProfileEditor from './pages/ProfileEditor';
import Prescriptions from './pages/Prescriptions';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Vitals from './pages/Vitals';
import MyMedicines from './pages/MyMedicines';

import { API_URL } from './config/api';

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
};

const AppLayout = () => {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded && !user) setChecking(false);
      return;
    }

    axios.get(`${API_URL}/profile/${user.id}`)
      .then((res) => {
        if (res.data?.status === 'success') {
          const profile = res.data.data;
          const onboardingDone = Boolean(profile?.onboardingCompleted ?? profile?.onboardingComplete);
          if (!onboardingDone) {
            navigate('/onboarding', { replace: true });
          }
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          navigate('/onboarding', { replace: true });
        }
      })
      .finally(() => setChecking(false));
  }, [isLoaded, user, navigate]);

  if (checking || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030712]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm">Validating MediKiosk session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 md:ml-72 flex flex-col min-w-0 pb-16 md:pb-0">
        <div className="sticky top-0 z-40 flex justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-8 pb-12">
          <Routes>
            {/* Core MediKiosk First-Mile Clinical Flow */}
            <Route path="/intake" element={<PatientIntake />} />
            <Route path="/waiting" element={<WaitingRoom />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/consent" element={<ConsentSettings />} />

            {/* General Patient & Profile Views */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<HealthProfile />} />
            <Route path="/profile/edit" element={<ProfileEditor />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/vitals" element={<Vitals />} />
            <Route path="/medicines" element={<MyMedicines />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default function App() {
  const { theme } = useTheme();

  return (
    <GoogleOAuthProvider clientId="208922674987-6ah3mphon2abt6g9hj7dpbj6gs4ql9cg.apps.googleusercontent.com">
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Routes>
            <Route
              path="/sign-in/*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030712]">
                  <SignIn routing="path" path="/sign-in" appearance={{ baseTheme: theme === 'dark' ? dark : undefined }} />
                </div>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030712]">
                  <SignUp routing="path" path="/sign-up" appearance={{ baseTheme: theme === 'dark' ? dark : undefined }} />
                </div>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
