// client/src/pages/Contact.jsx
import React, { useState } from 'react';
import { useToastStore } from '../store/toastStore';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export default function Contact() {
  const { addToast } = useToastStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      return addToast('Please fill out all fields.', 'warning');
    }
    addToast('Message received! We will contact you shortly.', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <span className="px-3 py-1 text-xs font-bold text-brand-teal-500 bg-brand-teal-500/10 rounded-full uppercase tracking-wider">Contact</span>
        <h1 className="text-4xl font-extrabold font-outfit mt-4 mb-3">Get in Touch</h1>
        <p className="text-sm text-brand-slate-500 dark:text-brand-slate-400 mb-8 max-w-md">
          Have questions about pricing, APIs, custom SLAs, or system security? Reach out directly.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 text-xs text-brand-slate-600 dark:text-brand-slate-355">
            <Mail className="w-5 h-5 text-brand-teal-500" />
            <span>support@billora.com</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-brand-slate-600 dark:text-brand-slate-355">
            <Phone className="w-5 h-5 text-brand-teal-500" />
            <span>+1 (800) BILL-SaaS</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="w-full p-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95"
          >
            Send Inquiry
          </button>
        </form>
      </div>
    </div>
  );
}
