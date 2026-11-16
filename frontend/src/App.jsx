import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

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

const AppLayout = () => {
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
          <Outlet />
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <GoogleOAuthProvider clientId="208922674987-6ah3mphon2abt6g9hj7dpbj6gs4ql9cg.apps.googleusercontent.com">
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Routes>
            {/* Clerk Authentication Routes */}
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

            {/* Main Application Layout with Top-Level Routes via Outlet */}
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="intake" element={<PatientIntake />} />
              <Route path="waiting" element={<WaitingRoom />} />
              <Route path="doctor" element={<DoctorDashboard />} />
              <Route path="consent" element={<ConsentSettings />} />
              <Route path="vitals" element={<Vitals />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="medicines" element={<MyMedicines />} />
              <Route path="profile" element={<HealthProfile />} />
              <Route path="profile/edit" element={<ProfileEditor />} />
              <Route path="settings" element={<Settings />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
