// client/src/pages/SuperAdmin.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { ShieldCheck, BarChart3, Users, Ban, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdmin() {
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadAdminSuite = async () => {
    setLoading(true);
    try {
      const stats = await apiRequest('/api/admin/analytics');
      setAnalytics(stats);

      const list = await apiRequest('/api/admin/organizations');
      setOrgs(list);

      const pays = await apiRequest('/api/admin/payments');
      setPayments(pays);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSuite();
  }, []);

  const handleToggleStatus = async (orgId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiRequest(`/api/admin/organizations/${orgId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus })
      });
      addToast(`Organization status updated to ${nextStatus}`, 'success');
      loadAdminSuite();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Banner */}
      <div className="flex items-center gap-3 p-4 bg-brand-teal-500/10 border border-brand-teal-500/20 rounded-2xl">
        <ShieldCheck className="w-6 h-6 text-brand-teal-500" />
        <div>
          <h2 className="text-sm font-bold font-outfit">Super Admin Global Suite</h2>
          <p className="text-[10px] text-brand-slate-500 dark:text-brand-slate-400">Manage all organization tiers, audit logs, and toggle tenant statuses.</p>
        </div>
      </div>

      {/* Global metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
          <p className="text-[10px] font-bold text-brand-slate-400 uppercase tracking-wider">Total Tenants</p>
          <h3 className="text-2xl font-extrabold font-outfit mt-1">{analytics?.metrics?.organizationsCount}</h3>
          <span className="text-[9px] text-brand-slate-500 block mt-2">Active workspace workspaces</span>
        </div>

        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
          <p className="text-[10px] font-bold text-brand-slate-400 uppercase tracking-wider">Global MRR</p>
          <h3 className="text-2xl font-extrabold font-outfit mt-1">${analytics?.metrics?.monthlyRecurringRevenue}</h3>
          <span className="text-[9px] text-brand-slate-500 block mt-2">Monthly Recurring Revenue</span>
        </div>

        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
          <p className="text-[10px] font-bold text-brand-slate-400 uppercase tracking-wider">Global ARR</p>
          <h3 className="text-2xl font-extrabold font-outfit mt-1">${analytics?.metrics?.annualRecurringRevenue}</h3>
          <span className="text-[9px] text-brand-slate-500 block mt-2">Annual Recurring Revenue</span>
        </div>

        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
          <p className="text-[10px] font-bold text-brand-slate-400 uppercase tracking-wider">Total Ledger Volume</p>
          <h3 className="text-2xl font-extrabold font-outfit mt-1">${analytics?.metrics?.totalRevenue}</h3>
          <span className="text-[9px] text-brand-slate-500 block mt-2">Cumulative cash volume</span>
        </div>

      </div>

      {/* Global MRR chart */}
      <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
        <h2 className="text-sm font-bold font-outfit mb-4">Global Revenue Trend</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics?.paymentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b20" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ background: '#09122c', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: '12px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorGlobal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Organizations Directory */}
      <div className="glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
        <div className="p-4 border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-teal-500" />
          <h2 className="text-sm font-bold font-outfit">Tenants Workspace Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 bg-brand-slate-100/30 dark:bg-brand-navy-950/10">
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Organization</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Slug / Ident</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Active Tier</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Status</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors last:border-none">
                  <td className="p-4 flex items-center gap-3">
                    <img 
                      src={org.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'} 
                      alt={org.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="font-bold text-brand-slate-800 dark:text-brand-slate-100">{org.name}</span>
                  </td>
                  <td className="p-4 font-mono text-[10px] text-brand-slate-500">{org.slug}</td>
                  <td className="p-4 text-brand-slate-700 dark:text-brand-slate-300 font-semibold">
                    {org.subscription ? org.subscription.planName : 'Free Starter'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full inline-flex items-center gap-0.5 ${
                      org.status === 'ACTIVE'
                        ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(org.id, org.status)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        org.status === 'ACTIVE'
                          ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500'
                          : 'border-brand-emerald-500/20 bg-brand-emerald-500/5 hover:bg-brand-emerald-500 hover:text-white text-brand-emerald-500'
                      }`}
                    >
                      {org.status === 'ACTIVE' ? 'Suspend Org' : 'Activate Org'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
