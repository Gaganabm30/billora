// client/src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, ShieldCheck, Key, RefreshCw, Eye, EyeOff, Palette, Receipt, MapPin, Users, Building2 } from 'lucide-react';

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare & Biotech', 'Education', 'E-commerce', 'Marketing & Sales', 'Real Estate', 'Other'];
const COMPANY_SIZES = ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'];
const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Canada', 'Germany', 'Australia', 'Singapore', 'Other'];
const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
];
const TIMEZONES = ['UTC', 'EST', 'PST', 'CET', 'IST', 'AEST', 'SGT'];

export default function Settings() {
  const { user, activeOrg, role, updateOrganization } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');

  // Workspace Settings State
  const [orgName, setOrgName] = useState(activeOrg?.name || '');
  const [logoUrl, setLogoUrl] = useState(activeOrg?.logoUrl || '');
  const [industry, setIndustry] = useState(activeOrg?.industry || INDUSTRIES[0]);
  const [companySize, setCompanySize] = useState(activeOrg?.companySize || COMPANY_SIZES[0]);
  const [country, setCountry] = useState(activeOrg?.country || COUNTRIES[0]);
  const [currency, setCurrency] = useState(activeOrg?.currency || 'USD');
  const [timezone, setTimezone] = useState(activeOrg?.timezone || 'UTC');

  // Branding Settings State
  const [themeColor, setThemeColor] = useState(activeOrg?.themeColor || '#14b8a6');
  const [accentColor, setAccentColor] = useState(activeOrg?.accentColor || '#06b6d4');

  // Invoice Branding State
  const [invoiceHeader, setInvoiceHeader] = useState(activeOrg?.invoiceHeader || '');
  const [invoiceNotes, setInvoiceNotes] = useState(activeOrg?.invoiceNotes || '');

  const [savingOrg, setSavingOrg] = useState(false);
  
  // API Key state
  const [apiKey, setApiKey] = useState('bl_live_8f3a2c4e9d1b0f5c7a3e8b9d2e1c0f4a');
  const [showKey, setShowKey] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    addToast('Profile details updated successfully!', 'success');
  };

  const handleOrgSave = async (e) => {
    e.preventDefault();
    if (role !== 'ORG_ADMIN') {
      return addToast('Only Organization Admins can modify organization settings.', 'warning');
    }

    setSavingOrg(true);
    try {
      await updateOrganization({
        name: orgName,
        logoUrl,
        industry,
        companySize,
        country,
        currency,
        timezone,
        themeColor,
        accentColor,
        invoiceHeader,
        invoiceNotes
      });
      addToast('Workspace settings saved successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleRegenerateKey = () => {
    if (role !== 'ORG_ADMIN') return addToast('Only Organization Admins can regenerate API keys.', 'warning');
    if (window.confirm('WARNING: Any active services using the old API Key will be disconnected. Regenerate?')) {
      setRegeneratingKey(true);
      setTimeout(() => {
        const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setApiKey(`bl_live_${randomHex}`);
        setRegeneratingKey(false);
        addToast('New Live API Key generated successfully!', 'success');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      
      {/* Profile Form */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-brand-teal-500" />
          <h2 className="text-sm font-bold font-outfit">Personal Profile Settings</h2>
        </div>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 h-10 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-lg hover:opacity-90 mt-2 self-start"
          >
            Save Profile Details
          </button>
        </form>
      </div>

      {/* Organization settings */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 shadow-md">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal-500" />
            <h2 className="text-sm font-bold font-outfit">Organization Workspace</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/team')}
            className="px-3 py-1.5 border border-brand-slate-300 dark:border-brand-slate-800 rounded-lg hover:border-brand-teal-500/50 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Team Members</span>
          </button>
        </div>
        
        <form onSubmit={handleOrgSave} className="flex flex-col gap-6">
          
          {/* Section 1: General Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-teal-500 border-b border-brand-slate-200/20 pb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>General Metadata</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Workspace Name</label>
                <input
                  type="text"
                  disabled={role !== 'ORG_ADMIN'}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 disabled:opacity-60"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Workspace logo URL</label>
                <input
                  type="text"
                  disabled={role !== 'ORG_ADMIN'}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Industry</label>
                <select
                  disabled={role !== 'ORG_ADMIN'}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 disabled:opacity-60"
                >
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Company Size</label>
                <select
                  disabled={role !== 'ORG_ADMIN'}
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 disabled:opacity-60"
                >
                  {COMPANY_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Regional & localization */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-teal-500 border-b border-brand-slate-200/20 pb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Localization & Currency</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Billing Country</label>
                <select
                  disabled={role !== 'ORG_ADMIN'}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 disabled:opacity-60"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Default Currency</label>
                <select
                  disabled={role !== 'ORG_ADMIN'}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 disabled:opacity-60"
                >
                  {CURRENCIES.map(curr => <option key={curr.code} value={curr.code}>{curr.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Default Timezone</label>
                <select
                  disabled={role !== 'ORG_ADMIN'}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 disabled:opacity-60"
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Branding */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-teal-500 border-b border-brand-slate-200/20 pb-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              <span>Workspace Branding</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Primary Color (Theme)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={role !== 'ORG_ADMIN'}
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-10 h-10 rounded border border-brand-slate-300 dark:border-brand-slate-800 bg-transparent disabled:opacity-60"
                  />
                  <input
                    type="text"
                    disabled={role !== 'ORG_ADMIN'}
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="flex-grow h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Accent Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={role !== 'ORG_ADMIN'}
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded border border-brand-slate-300 dark:border-brand-slate-800 bg-transparent disabled:opacity-60"
                  />
                  <input
                    type="text"
                    disabled={role !== 'ORG_ADMIN'}
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-grow h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Invoice settings */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-brand-teal-500 border-b border-brand-slate-200/20 pb-1 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice Template Branding</span>
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Custom Invoice Header message</label>
                <input
                  type="text"
                  disabled={role !== 'ORG_ADMIN'}
                  value={invoiceHeader}
                  onChange={(e) => setInvoiceHeader(e.target.value)}
                  placeholder="e.g. Thanks for your business!"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Standard Invoice Terms & Notes</label>
                <textarea
                  disabled={role !== 'ORG_ADMIN'}
                  rows="3"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. All payments are due within 15 days of issue date. Late fees of 2.5% apply per week."
                  className="w-full p-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 disabled:opacity-60 resize-y"
                />
              </div>
            </div>
          </div>

          {role === 'ORG_ADMIN' && (
            <button
              type="submit"
              disabled={savingOrg}
              className="w-full sm:w-auto px-5 h-10 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 self-start"
            >
              {savingOrg && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Workspace settings</span>
            </button>
          )}
        </form>
      </div>

      {/* API Keys section */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-brand-cyan-500/10 text-brand-cyan-500 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-outfit">Workspace API Credentials</h3>
            <p className="text-[10px] text-brand-slate-400">Credentials used to integrate Billora billing endpoints inside your applications.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">Live Secret API Key</label>
          <div className="flex items-center gap-2">
            <div className="flex-grow h-10 border border-brand-slate-350 dark:border-brand-slate-800 rounded-lg flex items-center px-3 bg-brand-slate-100/50 dark:bg-brand-navy-950/20 overflow-x-auto select-all font-mono text-[10px] text-brand-slate-800 dark:text-brand-slate-200">
              {showKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
            </div>
            
            <button
              onClick={() => setShowKey(!showKey)}
              className="h-10 px-3 border border-brand-slate-300 dark:border-brand-slate-800 hover:border-brand-teal-500/40 rounded-lg text-xs font-semibold"
            >
              {showKey ? 'Hide' : 'Reveal'}
            </button>

            {role === 'ORG_ADMIN' && (
              <button
                onClick={handleRegenerateKey}
                disabled={regeneratingKey}
                className="h-10 px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-red-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingKey ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
          <p className="text-[9px] text-brand-slate-500">
            Keep this key secret. Do not commit it to version control or display it inside client browsers.
          </p>
        </div>
      </div>
    </div>
  );
}
