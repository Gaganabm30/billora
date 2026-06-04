// client/src/pages/Features.jsx
import React from 'react';
import { Shield, BarChart2, Zap, Layers, RefreshCw, Activity } from 'lucide-react';

export default function Features() {
  const items = [
    { icon: Shield, title: 'Enterprise Role-Based Access Control', desc: 'Secure APIs and UI scopes mapping users to Organization Admin, Finance Manager, and Team Member roles.' },
    { icon: BarChart2, title: 'MRR & ARR Analytics', desc: 'Track MRR, recurring subscription growth, cash flows, and analytics inside customizable charts.' },
    { icon: Zap, title: 'Smart Metering Systems', desc: 'API usage rates, disk usage parameters, and active team seats are dynamically tracked and reported.' },
    { icon: Layers, title: 'Multi-Tenant Sandbox', desc: 'Maintain complete data isolation. Users belong to multiple organizations and switch context dynamically.' },
    { icon: RefreshCw, title: 'Payment Decline Simulators', desc: 'Test how your backend handles card payment failures, overdue invoices, and notifications.' },
    { icon: Activity, title: 'Compliance Audit Logging', desc: 'Log actions such as seat additions, plan changes, refunds, and permission modifications.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-3 py-1 text-xs font-bold text-brand-teal-500 bg-brand-teal-500/10 rounded-full uppercase tracking-wider">Capabilities</span>
        <h1 className="text-4xl font-extrabold font-outfit mt-4 mb-3">Engineered for Scale</h1>
        <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 max-w-xl mx-auto">
          Deep dive into the features that power Billora's billing & subscription platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass-panel p-8 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 flex items-start gap-5">
              <div className="p-3.5 rounded-xl bg-brand-teal-500/10 text-brand-teal-500 flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-outfit mb-2 text-brand-slate-800 dark:text-brand-slate-200">{item.title}</h3>
                <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
