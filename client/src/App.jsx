// client/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Suspended from './pages/Suspended';

// Dashboard Pages
import Overview from './pages/Overview';
import Subscriptions from './pages/Subscriptions';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import Usage from './pages/Usage';
import Support from './pages/Support';
import Audit from './pages/Audit';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import SuperAdmin from './pages/SuperAdmin';
import Onboarding from './pages/Onboarding';

// Route Guards
import { ProtectedRoute, SuperAdminRoute } from './routes/RouteGuards';

// Global UI
import ToastContainer from './components/ui/ToastContainer';

export default function App() {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Suspended workspace warning view */}
        <Route path="/suspended" element={<Suspended />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="billing" element={<Billing />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="team" element={<Team />} />
            <Route path="usage" element={<Usage />} />
            <Route path="support" element={<Support />} />
            <Route path="audit" element={<Audit />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            
            {/* Super Admin Global Suite */}
            <Route element={<SuperAdminRoute />}>
              <Route path="super-admin" element={<SuperAdmin />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback navigation */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* Global Toast Alerts */}
      <ToastContainer />
    </BrowserRouter>
  );
}
