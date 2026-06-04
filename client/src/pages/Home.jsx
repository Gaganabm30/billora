// client/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, Zap, BarChart3, Users, Key, ChevronRight, Check } from 'lucide-react';

export default function Home() {
  const stats = [
    { value: '$4.2B+', label: 'Volume Processed' },
    { value: '99.98%', label: 'Gateway Uptime' },
    { value: '180+', label: 'Supported Countries' },
    { value: '15M+', label: 'Subscribers Managed' }
  ];

  const features = [
    { icon: ShieldCheck, title: 'Granular RBAC', desc: 'Secure organizations with Super Admin, Org Admin, Finance, and Member roles.' },
    { icon: Zap, title: 'Usage-Based Meters', desc: 'Real-time calculation of API limits, storage capacity, and team seat consumption.' },
    { icon: BarChart3, title: 'Revenue Analytics', desc: 'Interactive charts tracking MRR, ARR, churn rate, and payment success trends.' },
    { icon: Users, title: 'Multi-Tenant Workspaces', desc: 'Isolate user spaces and support switching between organizations dynamically.' },
    { icon: CreditCard, title: 'Simulator Gateways', desc: 'Test checkout payments, simulated card declines, and refund rollbacks.' },
    { icon: Key, title: 'Audit Trail Logs', desc: 'Track compliance with activity records mapping user updates.' }
  ];

  const faqs = [
    { q: 'How does the role-based system work?', a: 'Billora enforces Role-Based Access Control (RBAC). A Super Admin manages all pricing and tenants globally; an Org Admin modifies memberships and subscriptions; a Finance Manager handles billing statements and refunds; a Team Member tracks usage metrics.' },
    { q: 'Is there support for card failures?', a: 'Yes! Billora features a simulated card failure gateway. You can trigger failed cards to see how the system logs overdue invoices and sends failed payment notifications.' },
    { q: 'Can I switch between tenant accounts?', a: 'Absolutely. If you belong to multiple workspaces, you can switch organizations dynamically from the top navbar or via the Ctrl+K command palette.' }
  ];

  return (
    <div className="relative overflow-hidden pt-8">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-teal-500/10 rounded-full filter blur-3xl -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-cyan-500/10 rounded-full filter blur-3xl -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-20 md:pt-24 md:pb-28">
        <span className="px-3.5 py-1.5 text-xs font-bold text-brand-teal-500 bg-brand-teal-500/10 dark:bg-brand-teal-500/5 rounded-full uppercase tracking-wider">
          Next-Gen SaaS Subscriptions
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold font-outfit mt-6 max-w-4xl mx-auto leading-tight">
          Role-Based Billing & Subscription <br />
          <span className="text-gradient-teal-cyan">Management for Modern Teams</span>
        </h1>
        <p className="text-base sm:text-lg text-brand-slate-500 dark:text-brand-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          Manage subscriptions, multi-tenant organizations, payment failures, invoices, and compliance audits with a premium fintech interface.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-6 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-semibold shadow-glow-teal hover:opacity-95 transition-opacity"
          >
            Create Free Account
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/pricing"
            className="w-full sm:w-auto px-6 h-12 flex items-center justify-center rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 text-sm font-semibold hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-900/30 transition-colors"
          >
            Explore Pricing
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-brand-slate-200/50 dark:border-brand-slate-900 bg-brand-slate-100/30 dark:bg-brand-navy-950/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-extrabold font-outfit text-brand-slate-800 dark:text-brand-slate-100">{stat.value}</p>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold font-outfit">SaaS Subscriptions Reimagined</h2>
          <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 mt-3">
            Designed to empower product managers, engineers, finance leads, and system administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 gradient-border flex flex-col items-start">
                <div className="p-3 rounded-xl bg-brand-teal-500/10 text-brand-teal-500 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-outfit mb-2 text-brand-slate-800 dark:text-brand-slate-200">{feature.title}</h3>
                <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-brand-slate-200 dark:border-brand-slate-900">
        <h2 className="text-2xl font-bold font-outfit text-center mb-10">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel p-5 rounded-xl border border-brand-slate-200/50 dark:border-brand-slate-900">
              <h3 className="text-sm font-bold text-brand-slate-800 dark:text-brand-slate-200">{faq.q}</h3>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
