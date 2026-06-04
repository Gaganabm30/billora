// client/src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { CreditCard, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const { register, loading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return addToast('All fields are required.', 'warning');
    }
    try {
      await register(name, email, password);
      addToast('Account created! Let\'s set up your workspace.', 'success');
      navigate('/onboarding');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-brand-slate-50 dark:bg-brand-navy-950 transition-colors duration-300">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-800/30 shadow-xl">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <CreditCard className="w-8 h-8 text-brand-teal-500" />
          <h1 className="text-2xl font-bold font-outfit text-gradient-teal-cyan">Create Account</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 transition-colors text-brand-slate-800 dark:text-brand-slate-100"
            />
          </div>

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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-center text-brand-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-teal-500 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
