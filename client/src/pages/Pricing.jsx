// client/src/pages/Pricing.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info } from 'lucide-react';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  const plans = [
    {
      name: 'Free Starter',
      price: 0,
      desc: 'Test out our platform and build your integration prototype.',
      features: ['1 Team Seat included', '1,000 API requests/month', '100 MB Storage limit', 'Standard dashboards', 'Community ticket support'],
      cta: 'Start Prototyping',
      popular: false
    },
    {
      name: 'Pro Premium',
      price: billingCycle === 'monthly' ? 49 : 40, // 490/yr
      desc: 'Ideal for scaling SaaS startups and active developer operations.',
      features: ['5 Team Seats included', '50,000 API requests/month', '10 GB Storage capacity', 'Full analytics dashboards', 'Priority 2-hour support', 'Custom GST/Tax invoices', 'Saved card profiles'],
      cta: 'Upgrade Workspace',
      popular: true
    },
    {
      name: 'Enterprise Shield',
      price: billingCycle === 'monthly' ? 299 : 249, // 2990/yr
      desc: 'Designed for high-scale enterprise platforms requiring maximum security.',
      features: ['Unlimited Seats', 'Unlimited API volume', '100 GB Storage capacity', 'Real-time Webhook streams', '24/7 dedicated support', 'Custom SLA agreement', 'Full RBAC customization', 'Advanced Audit logging'],
      cta: 'Contact Enterprise',
      popular: false
    }
  ];

  const comparisonRows = [
    { feature: 'Monthly Cost', free: '$0', pro: billingCycle === 'monthly' ? '$49' : '$40/mo', enterprise: billingCycle === 'monthly' ? '$299' : '$249/mo' },
    { feature: 'Included Seats', free: '1 Seat', pro: '5 Seats', enterprise: 'Unlimited' },
    { feature: 'API requests/mo', free: '1,000', pro: '50,000', enterprise: 'Unlimited' },
    { feature: 'Storage limit', free: '100 MB', pro: '10 GB', enterprise: '100 GB' },
    { feature: 'Audit log logs', free: 'No', pro: 'No', enterprise: 'Yes (Advanced)' },
    { feature: 'Support tier', free: 'Community', pro: 'Priority Email', enterprise: '24/7 Dedicated Account' },
    { feature: 'SLA guarantees', free: 'No', pro: 'No', enterprise: 'Yes (99.99%)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-3 py-1 text-xs font-bold text-brand-teal-500 bg-brand-teal-500/10 rounded-full uppercase tracking-wider">Pricing Plans</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-outfit mt-4 mb-3">Simple, Transparent Pricing</h1>
        <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 max-w-xl mx-auto">
          Start on our free tier and upgrade seamlessly as your organization scales.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-brand-teal-500' : 'text-brand-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-brand-slate-300 dark:bg-brand-slate-800 p-1 flex items-center transition-colors relative"
            aria-label="Toggle billing cycle"
          >
            <div className={`w-4 h-4 rounded-full bg-brand-teal-500 transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-brand-teal-500' : 'text-brand-slate-500'}`}>
            Yearly <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-brand-emerald-500/10 text-brand-emerald-500 rounded-full font-bold">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`glass-panel p-8 rounded-2xl border flex flex-col items-start relative ${
              plan.popular
                ? 'border-brand-teal-500/50 dark:border-brand-teal-500 bg-brand-teal-500/5 dark:bg-brand-teal-950/10 shadow-glow-teal'
                : 'border-brand-slate-200/50 dark:border-brand-slate-900 bg-white/40 dark:bg-brand-navy-950/20'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-bold text-white bg-brand-teal-500 rounded-full uppercase tracking-wider shadow">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold font-outfit mb-1">{plan.name}</h3>
            <p className="text-[11px] text-brand-slate-500 dark:text-brand-slate-400 mb-6 leading-relaxed h-12 overflow-hidden">{plan.desc}</p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-extrabold font-outfit">${plan.price}</span>
              <span className="text-xs text-brand-slate-500">/ {billingCycle === 'monthly' ? 'month' : 'month, billed annually'}</span>
            </div>

            <ul className="flex flex-col gap-3.5 mb-8 w-full flex-grow">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-brand-slate-700 dark:text-brand-slate-300">
                  <Check className="w-4 h-4 text-brand-teal-500 mt-0.5 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/signup"
              className={`w-full h-11 flex items-center justify-center rounded-xl font-bold text-xs transition-opacity hover:opacity-95 ${
                plan.popular
                  ? 'bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white shadow-glow-teal'
                  : 'bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison Grid */}
      <div className="max-w-5xl mx-auto border border-brand-slate-200/50 dark:border-brand-slate-900 glass-panel rounded-2xl overflow-hidden shadow-md">
        <div className="p-6 border-b border-brand-slate-200/50 dark:border-brand-slate-900 bg-brand-slate-100/40 dark:bg-brand-navy-950/40">
          <h2 className="text-lg font-bold font-outfit">Detailed Feature Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/50 dark:border-brand-slate-900">
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Features</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Free Starter</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Pro Premium</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Enterprise Shield</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="border-b border-brand-slate-200/50 dark:border-brand-slate-900 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors">
                  <td className="p-4 font-semibold text-brand-slate-700 dark:text-brand-slate-300">{row.feature}</td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">{row.free}</td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">{row.pro}</td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
