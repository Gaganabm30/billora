import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const { token, activeOrg, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If superadmin, skip organization onboarding checks
  if (user?.isSuperAdmin) {
    if (location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
  }

  // If organization is suspended, and user is NOT a global superadmin, block dashboard access
  if (activeOrg && activeOrg.status === 'SUSPENDED') {
    return <Navigate to="/suspended" replace />;
  }

  const hasCompletedOnboarding = activeOrg && activeOrg.isOnboardingCompleted;

  if (!hasCompletedOnboarding) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  } else {
    if (location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles }) => {
  const { role } = useAuthStore();

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-brand-slate-50 dark:bg-brand-navy-950">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-red-500/20">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-brand-slate-500 dark:text-brand-slate-400 text-sm mb-6">
            Your current role ({role}) does not have permission to view this resource. Contact your organization administrator to upgrade permissions.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export const SuperAdminRoute = () => {
  const { user } = useAuthStore();

  if (!user || !user.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
