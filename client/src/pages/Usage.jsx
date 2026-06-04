// client/src/pages/Usage.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Activity, Database, Users, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Usage() {
  const { activeOrg, role } = useAuthStore();
  const { addToast } = useToastStore();

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/usage');
      setUsage(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, [activeOrg]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const meters = [
    {
      title: 'API Request Volume',
      icon: Activity,
      used: usage?.metrics?.api?.used?.toLocaleString(),
      limit: usage?.plan?.apiLimit >= 999999 ? 'Unlimited' : usage?.metrics?.api?.limit?.toLocaleString(),
      percentage: usage?.metrics?.api?.percentage || 0,
      status: usage?.metrics?.api?.status,
      desc: 'API calls serviced for organization keys this billing period.'
    },
    {
      title: 'Storage Capacity',
      icon: Database,
      used: `${(usage?.metrics?.storage?.used / 1000).toFixed(1)} GB`,
      limit: `${(usage?.metrics?.storage?.limit / 1000).toFixed(0)} GB`,
      percentage: usage?.metrics?.storage?.percentage || 0,
      status: usage?.metrics?.storage?.status,
      desc: 'File assets and logs capacity hosted in the cloud.'
    },
    {
      title: 'Seat Allocation',
      icon: Users,
      used: usage?.metrics?.seats?.used,
      limit: usage?.plan?.seatLimit >= 99999 ? 'Unlimited' : usage?.metrics?.seats?.limit,
      percentage: usage?.metrics?.seats?.percentage || 0,
      status: usage?.metrics?.seats?.status,
      desc: 'Active team member profiles registered inside this workspace.'
    }
  ];

  const hasWarnings = meters.some(m => m.status === 'WARNING' || m.status === 'DANGER');

  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert Header if approaching limits */}
      {hasWarnings && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold font-outfit">Approaching Plan Limits</h4>
            <p className="text-[10px] opacity-90 mt-1 leading-relaxed">
              Your organization workspace is approaching limits set by your current subscription tier. Upgrading your tier will expand thresholds for storage and team seats.
            </p>
          </div>
          {role === 'ORG_ADMIN' && (
            <Link 
              to="/dashboard/subscriptions" 
              className="ml-auto px-3.5 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      )}

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {meters.map((meter, i) => {
          const Icon = meter.icon;
          const isDanger = meter.status === 'DANGER';
          const isWarning = meter.status === 'WARNING';
          
          return (
            <div 
              key={i} 
              className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className="p-2.5 rounded-xl bg-brand-teal-500/10 text-brand-teal-500">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-brand-slate-400 uppercase tracking-wider block">Usage</span>
                    <span className="text-sm font-bold text-brand-slate-800 dark:text-brand-slate-100">
                      {meter.used} <span className="font-normal text-brand-slate-400">/ {meter.limit}</span>
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-250 mb-1">{meter.title}</h3>
                <p className="text-[10px] text-brand-slate-400 dark:text-brand-slate-550 leading-relaxed mb-6">{meter.desc}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                  <span className={isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-brand-teal-500'}>
                    {meter.percentage}% consumed
                  </span>
                </div>
                
                <div className="w-full bg-brand-slate-200 dark:bg-brand-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger 
                        ? 'bg-red-500' 
                        : isWarning 
                        ? 'bg-amber-500' 
                        : 'bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500'
                    }`}
                    style={{ width: `${meter.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
