// client/src/pages/About.jsx
import React from 'react';
import { ShieldCheck, Award, Smile } from 'lucide-react';

export default function About() {
  const cards = [
    { icon: ShieldCheck, title: 'Compliance Audited', desc: 'SOC2 Type II, ISO 27001, and PCI-DSS compliance frameworks standard across all transaction networks.' },
    { icon: Award, title: 'Fintech Leadership', desc: 'Billora is built by developer veterans with years of experience building secure transaction infrastructure.' },
    { icon: Smile, title: 'Developer First', desc: 'Clean JSON APIs, sandbox environments, and robust documentation are at the core of our platform.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-3 py-1 text-xs font-bold text-brand-teal-500 bg-brand-teal-500/10 rounded-full uppercase tracking-wider">Our Mission</span>
        <h1 className="text-4xl font-extrabold font-outfit mt-4 mb-3">Behind Billora Billing</h1>
        <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 max-w-xl mx-auto">
          We aim to empower SaaS companies to launch, monetize, and scale globally without spending months writing custom subscription code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 text-center flex flex-col items-center">
              <div className="p-3 rounded-xl bg-brand-teal-500/10 text-brand-teal-500 mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-outfit mb-2 text-brand-slate-800 dark:text-brand-slate-200">{card.title}</h3>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
