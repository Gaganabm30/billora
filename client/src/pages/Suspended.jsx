// client/src/pages/Suspended.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, apiRequest } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { AlertOctagon, LogOut, ChevronDown, LifeBuoy } from 'lucide-react';

export default function Suspended() {
  const { activeOrg, logout, switchOrg, addToast } = useAuthStore();
  const navigate = useNavigate();
  const [myOrgs, setMyOrgs] = useState([]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  useEffect(() => {
    const loadUserOrgs = async () => {
      try {
        const orgs = await apiRequest('/api/auth/organizations');
        setMyOrgs(orgs);
      } catch (err) {
        console.error(err);
      }
    };
    loadUserOrgs();
  }, []);

  const handleOrgSwitch = async (orgId) => {
    try {
      await switchOrg(orgId);
      setOrgDropdownOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-slate-50 dark:bg-brand-navy-950 text-brand-slate-900 dark:text-brand-slate-100 transition-colors duration-300">
      <div className="glass-panel p-8 rounded-2xl max-w-lg w-full text-center border border-red-500/20 shadow-2xl relative overflow-hidden">
        
        {/* Decorative alert background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 rounded-full filter blur-3xl -z-10" />

        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold font-outfit mb-3">Workspace Suspended</h1>
        <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 mb-6 leading-relaxed">
          Access to the workspace <span className="font-bold text-brand-slate-700 dark:text-brand-slate-200">"{activeOrg?.name}"</span> has been suspended by system administrators. This usually occurs due to an outstanding unpaid invoice balance, policy non-compliance, or explicit suspension.
        </p>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {/* Org switcher if they have other organizations */}
          {myOrgs.filter(o => o.id !== activeOrg?.id).length > 0 && (
            <div className="relative">
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-slate-200/50 dark:bg-brand-slate-800/40 text-xs font-semibold hover:bg-brand-slate-200 dark:hover:bg-brand-slate-800 transition-colors"
              >
                <span>Switch Workspace Tenant</span>
                <ChevronDown className="w-4 h-4 opacity-75" />
              </button>
              {orgDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-10 glass-panel border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl shadow-lg p-1.5 bg-white dark:bg-brand-navy-950">
                  {myOrgs.filter(o => o.id !== activeOrg?.id).map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-brand-teal-500/10 hover:text-brand-teal-500 transition-colors"
                    >
                      {org.name} {org.status === 'SUSPENDED' ? '(Suspended)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Support Link */}
          <button 
            onClick={() => navigate('/contact')} 
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-brand-slate-300 dark:border-brand-slate-700 text-xs font-semibold hover:bg-brand-slate-200/40 dark:hover:bg-brand-slate-800/20 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 text-brand-teal-500" />
            <span>Contact Support</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
