// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { CreditCard, Eye, EyeOff, ShieldCheck, UserCheck, Wallet, BadgeCheck } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return addToast('Please enter both email and password.', 'warning');
    }
    try {
      await login(email, password);
      addToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Helper for one-click demo logins
  const handleQuickLogin = async (demoEmail) => {
    try {
      await login(demoEmail, 'password123');
      addToast(`Logged in as ${demoEmail}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const demoRoles = [
    { email: 'superadmin@billora.com', label: 'Sarah (Super Admin)', icon: ShieldCheck, desc: 'Global pricing plans & tenant control' },
    { email: 'admin@acme.com', label: 'Alex (Org Admin)', icon: BadgeCheck, desc: 'Manage invoices, invite users, change plans' },
    { email: 'finance@acme.com', label: 'Marcus (Finance Manager)', icon: Wallet, desc: 'Ledgers, refunds & statements' },
    { email: 'member@acme.com', label: 'Emma (Team Member)', icon: UserCheck, desc: 'View current plan & file support tickets' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-brand-slate-50 dark:bg-brand-navy-950 transition-colors duration-300">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Column - Form */}
        <div className="glass-panel p-8 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-800/30 shadow-xl">
          <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
            <CreditCard className="w-8 h-8 text-brand-teal-500" />
            <h1 className="text-2xl font-bold font-outfit text-gradient-teal-cyan">Welcome Back</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 transition-colors text-brand-slate-800 dark:text-brand-slate-100"
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-10 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 transition-colors text-brand-slate-800 dark:text-brand-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[38px] text-brand-slate-400 hover:text-brand-slate-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center text-brand-slate-500 mt-6">
            Don't have an account? <Link to="/signup" className="text-brand-teal-500 font-bold hover:underline">Register now</Link>
          </p>
        </div>

        {/* Right Column - Demo Role Selection */}
        <div className="flex flex-col gap-6">
          <div className="text-center md:text-left">
            <span className="px-3 py-1 text-[10px] font-bold text-brand-teal-500 bg-brand-teal-500/10 rounded-full uppercase tracking-wider">Developer Sandbox</span>
            <h2 className="text-xl font-bold font-outfit mt-2 mb-1">Quick Demo Access</h2>
            <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400">
              Skip typing and log in instantly with any pre-seeded tenant role to test our complete Role-Based Access Control (RBAC) middleware flow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {demoRoles.map((roleInfo) => {
              const Icon = roleInfo.icon;
              return (
                <button
                  key={roleInfo.email}
                  onClick={() => handleQuickLogin(roleInfo.email)}
                  disabled={loading}
                  className="w-full p-4 rounded-2xl glass-panel border border-brand-slate-200/50 dark:border-brand-slate-800/10 hover:border-brand-teal-500/40 text-left flex items-start gap-4 hover:shadow-lg transition-all group"
                >
                  <div className="p-2.5 rounded-xl bg-brand-teal-500/10 text-brand-teal-500 group-hover:bg-brand-teal-500 group-hover:text-white transition-all flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-slate-800 dark:text-brand-slate-200">{roleInfo.label}</h3>
                    <p className="text-[11px] text-brand-slate-500 mt-0.5 leading-relaxed">{roleInfo.desc}</p>
                    <code className="text-[9px] text-brand-teal-500 block mt-1 font-mono">{roleInfo.email}</code>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
