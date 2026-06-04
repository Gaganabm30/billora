// client/src/pages/Overview.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useThemeStore } from '../store/themeStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, CreditCard, Users, 
  TrendingUp, AlertCircle, RefreshCw, Sparkles, PlusCircle,
  CheckCircle, Clock, ArrowRight, UserPlus, FileText, ArrowUp, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { activeOrg, role } = useAuthStore();
  const { addToast } = useToastStore();
  const { theme } = useThemeStore();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [teamCount, setTeamCount] = useState(1);
  const [usage, setUsage] = useState(null);

  // FTUE Actions Loading state
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active subscription
      const sub = await apiRequest('/api/subscriptions/active');
      
      // 2. Fetch payments list
      const paymentList = await apiRequest('/api/billing/payments');
      setPayments(paymentList);

      // 3. Fetch invoices list
      const invoiceList = await apiRequest('/api/invoices');
      setInvoices(invoiceList);

      // 4. Fetch team members list
      try {
        const teamList = await apiRequest('/api/team');
        setTeamCount(teamList.length);
      } catch (e) {
        setTeamCount(1);
      }

      // 5. Fetch usage metrics
      const usageMetrics = await apiRequest('/api/usage');
      setUsage(usageMetrics);

      // Build mock metrics dashboard cards
      const successPayments = paymentList.filter(p => p.status === 'SUCCESS');
      const totalRev = successPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const failedCount = paymentList.filter(p => p.status === 'FAILED').length;

      setMetrics({
        monthlyRevenue: sub?.plan?.priceMonthly || 0,
        activeSubs: sub?.status === 'ACTIVE' || sub?.status === 'TRIALING' ? 1 : 0,
        failedPayments: failedCount,
        totalVolume: totalRev,
        planName: sub?.plan?.name || 'Free'
      });
    } catch (err) {
      console.error(err);
      // Fallback defaults
      setMetrics({ monthlyRevenue: 0, activeSubs: 0, failedPayments: 0, totalVolume: 0, planName: 'Free' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeOrg]);

  const simulatePaymentFail = async () => {
    try {
      await apiRequest('/api/billing/simulate-failed', { method: 'POST' });
      addToast('Card charge failure simulated! Check notifications.', 'error');
      loadDashboardData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCreateTestInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      await apiRequest('/api/billing/create-test-invoice', { method: 'POST' });
      addToast('Test client invoice generated! Ready for simulated payment.', 'success');
      loadDashboardData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleReceiveTestPayment = async () => {
    const pendingInvoice = invoices.find(i => i.status === 'PENDING');
    if (!pendingInvoice) {
      return addToast('No pending invoice found. Please generate a test invoice first.', 'warning');
    }

    setProcessingPayment(true);
    try {
      await apiRequest('/api/billing/process-payment', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: pendingInvoice.id,
          paymentMethod: 'UPI (simulated@upi)'
        })
      });
      addToast('Simulated payment received! Dashboard has evolved.', 'success');
      loadDashboardData();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Pre-configured Recharts graph data representing monthly cycles
  const chartData = [
    { name: 'Jan', Revenue: 1200, Subscriptions: 15 },
    { name: 'Feb', Revenue: 1900, Subscriptions: 22 },
    { name: 'Mar', Revenue: 3400, Subscriptions: 38 },
    { name: 'Apr', Revenue: metrics?.monthlyRevenue ? 3400 + metrics.monthlyRevenue : 3400, Subscriptions: 45 },
    { name: 'May', Revenue: metrics?.totalVolume ? 4500 + metrics.totalVolume : 4500, Subscriptions: 52 }
  ];

  // FTUE Checklist evaluations
  const checklist = [
    { id: 'step_create', title: 'Create business organization workspace', desc: 'Set up your tenant identity metadata.', done: true },
    { id: 'step_plan', title: 'Choose a subscription tier plan', desc: 'Select between Free, Pro or Enterprise.', done: true },
    { id: 'step_team', title: 'Invite team members to workspace', desc: 'Add colleagues to collaborate.', done: teamCount > 1, link: '/dashboard/team', actionText: 'Invite Team' },
    { id: 'step_invoice', title: 'Generate your first client invoice', desc: 'Create a pending billing item.', done: invoices.length > 0, action: handleCreateTestInvoice, actionText: 'Generate Invoice', loading: generatingInvoice },
    { id: 'step_pay', title: 'Receive your first simulation payment', desc: 'Process a mock UPI or card payment.', done: payments.length > 0, action: handleReceiveTestPayment, actionText: 'Process Payment', loading: processingPayment, disabled: invoices.length === 0 }
  ];

  const completedTasksCount = checklist.filter(t => t.done).length;
  const isNewWorkspace = payments.length === 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl mt-4" />
      </div>
    );
  }

  // --- RENDERING FIRST TIME EXPERIENCE ---
  if (isNewWorkspace) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        
        {/* Welcome Premium Banner */}
        <div className="p-6 rounded-3xl glass-panel border border-brand-teal-500/20 bg-gradient-to-r from-brand-teal-500/10 to-brand-cyan-500/5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-teal-500 to-brand-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {activeOrg ? activeOrg.name.slice(0, 2).toUpperCase() : 'B'}
            </div>
            <div>
              <h1 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Welcome to {activeOrg ? activeOrg.name : 'Billora'}!</span>
                <Sparkles className="w-4 h-4 text-brand-teal-500 animate-pulse" />
              </h1>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1 max-w-md">
                Your sandbox tenant environment is set up and running. Complete the checklist below to activate the live charts.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-brand-slate-200 dark:bg-brand-slate-900 border border-brand-slate-350 dark:border-brand-slate-800 rounded-full text-[10px] font-bold text-brand-slate-600 dark:text-brand-slate-350">
            Tier: {metrics?.planName}
          </span>
        </div>

        {/* Progress Checklist Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Checklist card */}
          <div className="md:col-span-2 glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-outfit">Guided Workspace Checklist</h3>
                <span className="text-xs font-semibold text-brand-slate-500">{completedTasksCount} / {checklist.length} Complete</span>
              </div>
              {/* Checklist Progress Bar */}
              <div className="w-full bg-brand-slate-200 dark:bg-brand-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-brand-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedTasksCount / checklist.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {checklist.map((task, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl border border-brand-slate-200/20 dark:border-brand-slate-850 bg-brand-slate-100/10 dark:bg-brand-navy-950/10">
                  <div className="flex items-start gap-2.5">
                    {task.done ? (
                      <CheckCircle className="w-4 h-4 text-brand-teal-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-brand-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-bold ${task.done ? 'text-brand-slate-500 line-through opacity-85' : 'text-brand-slate-800 dark:text-brand-slate-200'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-brand-slate-400 mt-0.5">{task.desc}</p>
                    </div>
                  </div>

                  {/* Task Action button */}
                  {!task.done && (
                    task.link ? (
                      <Link 
                        to={task.link}
                        className="px-2.5 py-1 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>{task.actionText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={task.action}
                        disabled={task.loading || task.disabled}
                        className="px-2.5 py-1 bg-brand-teal-500 text-white font-bold text-[10px] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                      >
                        {task.loading && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                        <span>{task.actionText}</span>
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Action Panel */}
          <div className="flex flex-col gap-6">
            
            {/* Quick stats box */}
            <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold text-brand-slate-400 uppercase tracking-wider">Workspace Summary</h3>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between border-b border-brand-slate-200/40 dark:border-brand-slate-850 pb-2">
                  <span className="text-brand-slate-500">Industry</span>
                  <span className="font-semibold">{activeOrg?.industry || 'Technology'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-brand-slate-200/40 dark:border-brand-slate-850 pb-2">
                  <span className="text-brand-slate-500">Team Seats</span>
                  <span className="font-semibold">{teamCount} active</span>
                </div>
                <div className="flex items-center justify-between border-b border-brand-slate-200/40 dark:border-brand-slate-850 pb-2">
                  <span className="text-brand-slate-500">Invoices</span>
                  <span className="font-semibold">{invoices.length} created</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-brand-slate-500">Transactions</span>
                  <span className="font-semibold">0 completed</span>
                </div>
              </div>
            </div>

            {/* Simulated Help card */}
            <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 rounded-2xl bg-gradient-to-br from-brand-teal-500/5 to-brand-cyan-500/5 flex flex-col justify-between flex-grow">
              <div>
                <span className="p-2 bg-brand-teal-500/10 text-brand-teal-500 rounded-xl inline-block mb-3">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <h3 className="text-xs font-bold font-outfit mb-1">Need help testing?</h3>
                <p className="text-[10px] text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed mb-4">
                  Click **"Generate Invoice"** to simulate a customer invoice, then click **"Process Payment"** to trigger a success payment event.
                </p>
              </div>
              <Link
                to="/dashboard/support"
                className="h-9 flex items-center justify-center rounded-xl bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Open Ticket Desk
              </Link>
            </div>
            
          </div>
        </div>

        {/* Empty State visual illustration section */}
        <div className="glass-card p-8 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-teal-500/5 text-brand-teal-500 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="font-bold text-sm text-brand-slate-800 dark:text-brand-slate-200">No transactions recorded yet</h3>
          <p className="text-[11px] text-brand-slate-500 dark:text-brand-slate-400 mt-1 max-w-md leading-relaxed">
            Once you receive payments, your MRR growth, sales, API consumption counts, and payment logs will appear in this space.
          </p>
        </div>

      </div>
    );
  }

  // --- RENDERING FULL ACTIVE DASHBOARD ---
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-2">
            <span>Welcome, {activeOrg ? activeOrg.name : 'Billora Admin'}</span>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Workspace Active" />
          </h1>
          <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1 flex items-center gap-1">
            <span>Current Tier:</span>
            <span className="font-bold text-brand-teal-500">{metrics?.planName}</span>
            <span>• Role:</span>
            <span className="font-semibold text-brand-cyan-500">{role?.replace('_', ' ')}</span>
            <span>• Industry:</span>
            <span className="font-semibold text-brand-slate-450">{activeOrg?.industry || 'Technology'}</span>
          </p>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="flex items-center gap-2">
          <button 
            onClick={loadDashboardData}
            className="p-2 rounded-lg bg-white dark:bg-brand-slate-900 border border-brand-slate-200 dark:border-brand-slate-800 hover:border-brand-teal-500/50 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4 text-brand-slate-600 dark:text-brand-slate-400" />
          </button>
          
          {(role === 'ORG_ADMIN' || role === 'FINANCE_MANAGER') && (
            <button
              onClick={simulatePaymentFail}
              className="px-3 h-9 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-red-500/20"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate Decline</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">MRR Revenue</p>
              <h3 className="text-2xl font-extrabold font-outfit mt-1.5">${metrics?.monthlyRevenue}</h3>
            </div>
            <div className="p-2 bg-brand-teal-500/10 text-brand-teal-500 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-brand-emerald-500 font-bold mt-4">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">Active Subscriptions</p>
              <h3 className="text-2xl font-extrabold font-outfit mt-1.5">{metrics?.activeSubs}</h3>
            </div>
            <div className="p-2 bg-brand-cyan-500/10 text-brand-cyan-500 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-brand-slate-500 mt-4 font-semibold">
            <span>Current plan status: {metrics?.activeSubs > 0 ? 'Good' : 'Trialing'}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">Failed Charges</p>
              <h3 className="text-2xl font-extrabold font-outfit mt-1.5">{metrics?.failedPayments}</h3>
            </div>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold mt-4 ${metrics?.failedPayments > 0 ? 'text-red-500' : 'text-brand-slate-500'}`}>
            <span>{metrics?.failedPayments > 0 ? 'Action required in billing' : 'No card declines logged'}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">Storage Consumed</p>
              <h3 className="text-2xl font-extrabold font-outfit mt-1.5">
                {usage?.metrics?.storage?.used ? (usage.metrics.storage.used / 1000).toFixed(1) : 0} GB
              </h3>
            </div>
            <div className="p-2 bg-brand-emerald-500/10 text-brand-emerald-500 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-brand-slate-500 mt-4 font-semibold w-full">
            <div className="w-full bg-brand-slate-200 dark:bg-brand-slate-800 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${usage?.metrics?.storage?.percentage > 80 ? 'bg-red-500' : 'bg-brand-teal-500'}`}
                style={{ width: `${usage?.metrics?.storage?.percentage || 0}%` }}
              />
            </div>
            <span className="font-bold">{usage?.metrics?.storage?.percentage || 0}%</span>
          </div>
        </div>

      </div>

      {/* Warning Alert if storage is high */}
      {usage?.metrics?.storage?.percentage > 80 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold font-outfit">Storage Limit Alert</h4>
            <p className="text-[10px] opacity-90 mt-1 leading-relaxed">
              Your organization has consumed {usage.metrics.storage.used} MB of your {usage.metrics.storage.limit} MB limit ({usage.metrics.storage.percentage}%). Upgrading your plan will increase limits.
            </p>
          </div>
          {role === 'ORG_ADMIN' && (
            <Link 
              to="/dashboard/subscriptions" 
              className="ml-auto px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold"
            >
              Upgrade
            </Link>
          )}
        </div>
      )}

      {/* Chart Section */}
      <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold font-outfit">Revenue and growth trends</h2>
            <p className="text-[10px] text-brand-slate-500 dark:text-brand-slate-400">Total volume processed vs active subscriber trends over time.</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b20" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  background: theme === 'dark' ? '#09122c' : '#ffffff', 
                  border: '1px solid rgba(20, 184, 166, 0.2)',
                  borderRadius: '12px',
                  fontSize: '11px' 
                }} 
              />
              <Area type="monotone" dataKey="Revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lower Row - Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold font-outfit">Recent Transactions</h2>
              <Link to="/dashboard/payments" className="text-[10px] text-brand-teal-500 hover:underline font-bold">View Ledger</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10">
                    <th className="py-2.5 font-bold text-brand-slate-500">Transaction ID</th>
                    <th className="py-2.5 font-bold text-brand-slate-500">Amount</th>
                    <th className="py-2.5 font-bold text-brand-slate-500">Method</th>
                    <th className="py-2.5 font-bold text-brand-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 4).map((pay) => (
                    <tr key={pay.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 last:border-none">
                      <td className="py-3 font-semibold font-mono text-[11px] truncate max-w-[120px]">{pay.transactionId}</td>
                      <td className="py-3 font-bold">${pay.amount.toFixed(2)}</td>
                      <td className="py-3 text-brand-slate-500">{pay.paymentMethod}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          pay.status === 'SUCCESS'
                            ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                            : pay.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-brand-slate-400">No payment logs created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Help box */}
        <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between bg-gradient-to-br from-brand-teal-500/5 to-brand-cyan-500/5">
          <div>
            <span className="p-2 bg-brand-teal-500/10 text-brand-teal-500 rounded-xl inline-block mb-4">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold font-outfit mb-2">Need billing support?</h3>
            <p className="text-[11px] text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed mb-6">
              You can instantly open a support ticket to chat with our automated support bot. Raise issues regarding plan seat upgrades, refunds, or transaction declines.
            </p>
          </div>
          <Link
            to="/dashboard/support"
            className="h-10 flex items-center justify-center rounded-xl bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Open Ticket Desk
          </Link>
        </div>

      </div>

    </div>
  );
}
