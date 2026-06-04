// client/src/pages/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import confetti from 'canvas-confetti';
import { 
  Building2, Check, Plus, Trash2, Users, CreditCard, 
  ArrowRight, ArrowLeft, Briefcase, Globe, Coins, Sparkles, Smile 
} from 'lucide-react';

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150', // Teal/purple abstract
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', // Tech clean
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150', // Corporate blue
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150', // Office building abstract
];

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare & Biotech', 'Education', 'E-commerce', 'Marketing & Sales', 'Real Estate', 'Other'];
const COMPANY_SIZES = ['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees'];
const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Canada', 'Germany', 'Australia', 'Singapore', 'Other'];
const CURRENCIES = [
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
];

export default function Onboarding() {
  const { user, completeOnboarding } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States
  // Step 1: Organization metadata
  const [orgName, setOrgName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(PRESET_LOGOS[0]);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [companySize, setCompanySize] = useState(COMPANY_SIZES[0]);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [currency, setCurrency] = useState('USD');

  // Step 2: Subscription Plan
  const [planSlug, setPlanSlug] = useState('free');

  // Step 3: Team Invitations
  const [invites, setInvites] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('TEAM_MEMBER');

  // Step 4: Payment Method Connection
  const [paymentType, setPaymentType] = useState('CARD'); // CARD, UPI, BANK
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankRouting, setBankRouting] = useState('');

  const nextStep = () => {
    if (step === 1 && !orgName.trim()) {
      return addToast('Please enter an organization name.', 'warning');
    }
    if (step === 4 && planSlug !== 'free') {
      if (paymentType === 'CARD' && (!cardNumber || !cardExpiry || !cardCvv)) {
        return addToast('Please fill out card details to subscribe to a premium plan.', 'warning');
      }
      if (paymentType === 'UPI' && !upiId.trim()) {
        return addToast('Please enter your UPI ID.', 'warning');
      }
      if (paymentType === 'BANK' && (!bankAccNumber || !bankRouting)) {
        return addToast('Please enter your bank account information.', 'warning');
      }
    }
    
    if (step === 4) {
      // Trigger a confetti burst on moving to final review step
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    }

    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const addInvite = () => {
    if (!memberEmail.trim()) return addToast('Please enter a team member email.', 'warning');
    if (invites.some(i => i.email === memberEmail)) {
      return addToast('This email is already in the invite list.', 'warning');
    }
    setInvites([...invites, { email: memberEmail, name: memberName || memberEmail.split('@')[0], role: memberRole }]);
    setMemberEmail('');
    setMemberName('');
    setMemberRole('TEAM_MEMBER');
    addToast('Invited member added to list.', 'success');
  };

  const removeInvite = (idx) => {
    setInvites(invites.filter((_, i) => i !== idx));
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      const finalLogo = customLogoUrl.trim() || selectedLogo;
      
      const onboardingData = {
        orgName,
        logoUrl: finalLogo,
        industry,
        companySize,
        country,
        currency,
        planSlug,
        invites,
        paymentMethod: planSlug === 'free' ? null : {
          type: paymentType,
          details: paymentType === 'CARD' 
            ? `CARD ending in ${cardNumber.slice(-4)}`
            : paymentType === 'UPI' 
            ? `UPI ID: ${upiId}` 
            : `BANK Account: ••••${bankAccNumber.slice(-4)}`
        }
      };

      await completeOnboarding(onboardingData);
      
      // Giant confetti shower on success
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      addToast(`Workspace ${orgName} has been initialized! Welcome!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-slate-50 dark:bg-brand-navy-950 transition-colors duration-300">
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-brand-slate-200/50 dark:border-brand-slate-800/30 shadow-2xl relative overflow-hidden">
        
        {/* Glowing Background Blob */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-brand-teal-500/10 to-brand-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Header & Steps Tracker */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-teal-500" />
              <span className="font-outfit font-bold text-gradient-teal-cyan tracking-wide uppercase text-xs">Setup Workspace</span>
            </div>
            <span className="text-xs text-brand-slate-500 dark:text-brand-slate-400 font-semibold">Step {step} of 5</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-brand-slate-200 dark:bg-brand-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Forms */}

        {/* STEP 1: ORGANIZATION DETAILS */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-teal-500" />
                <span>Tell us about your organization</span>
              </h2>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">Let's initialize your team's tenant workspace environment.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Company / Workspace Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 transition-colors text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              {/* Logo Selectors */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-brand-slate-500 uppercase tracking-wider">Choose a Company Logo</label>
                <div className="flex items-center gap-3 mb-3">
                  {PRESET_LOGOS.map((logo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSelectedLogo(logo); setCustomLogoUrl(''); }}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedLogo === logo && !customLogoUrl ? 'border-brand-teal-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={logo} alt="Preset Logo" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customLogoUrl}
                  onChange={(e) => { setCustomLogoUrl(e.target.value); setSelectedLogo(''); }}
                  placeholder="Or paste a custom image URL..."
                  className="w-full h-9 px-4 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 transition-colors text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                  >
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                  >
                    {COMPANY_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Country Location</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-brand-slate-500 uppercase tracking-wider">Billing Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                  >
                    {CURRENCIES.map(curr => <option key={curr.code} value={curr.code}>{curr.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT PLAN */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-teal-500" />
                <span>Select a Subscription Plan</span>
              </h2>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">Choose the scale and quota limits that fit your team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Card */}
              <div 
                onClick={() => setPlanSlug('free')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  planSlug === 'free'
                    ? 'border-brand-teal-500 bg-brand-teal-500/5'
                    : 'border-brand-slate-200 dark:border-brand-slate-850 bg-white/20 dark:bg-brand-navy-900/10 hover:border-brand-teal-500/30'
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm">Free Starter</h3>
                  <p className="text-[10px] text-brand-slate-500 mt-1">For sandbox testing.</p>
                  <p className="text-xl font-black mt-3 font-outfit">$0 <span className="text-xs font-normal text-brand-slate-400">/ mo</span></p>
                  <ul className="text-[10px] text-brand-slate-600 dark:text-brand-slate-400 mt-4 flex flex-col gap-1.5">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 1 Team Seat</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 1K API requests/mo</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 100 MB Storage</li>
                  </ul>
                </div>
                {planSlug === 'free' && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-teal-500 mt-4 text-center">Selected</span>}
              </div>

              {/* Pro Card */}
              <div 
                onClick={() => setPlanSlug('pro')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  planSlug === 'pro'
                    ? 'border-brand-teal-500 bg-brand-teal-500/5'
                    : 'border-brand-slate-200 dark:border-brand-slate-850 bg-white/20 dark:bg-brand-navy-900/10 hover:border-brand-teal-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">Pro Premium</h3>
                    <span className="px-1.5 py-0.5 bg-brand-teal-500/10 text-brand-teal-500 rounded text-[8px] font-bold">POPULAR</span>
                  </div>
                  <p className="text-[10px] text-brand-slate-500 mt-1">For growing startups.</p>
                  <p className="text-xl font-black mt-3 font-outfit">$49 <span className="text-xs font-normal text-brand-slate-400">/ mo</span></p>
                  <ul className="text-[10px] text-brand-slate-600 dark:text-brand-slate-400 mt-4 flex flex-col gap-1.5">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 5 Team Seats</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 50K API requests/mo</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 10 GB Storage</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> Premium Payments</li>
                  </ul>
                </div>
                {planSlug === 'pro' && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-teal-500 mt-4 text-center">Selected</span>}
              </div>

              {/* Enterprise Card */}
              <div 
                onClick={() => setPlanSlug('enterprise')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  planSlug === 'enterprise'
                    ? 'border-brand-teal-500 bg-brand-teal-500/5'
                    : 'border-brand-slate-200 dark:border-brand-slate-850 bg-white/20 dark:bg-brand-navy-900/10 hover:border-brand-teal-500/30'
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm">Enterprise Shield</h3>
                  <p className="text-[10px] text-brand-slate-500 mt-1">For large systems.</p>
                  <p className="text-xl font-black mt-3 font-outfit">$299 <span className="text-xs font-normal text-brand-slate-400">/ mo</span></p>
                  <ul className="text-[10px] text-brand-slate-600 dark:text-brand-slate-400 mt-4 flex flex-col gap-1.5">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> Unlimited Seats</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> Unlimited API Calls</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> 100 GB Storage</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-brand-teal-500" /> SLA Support</li>
                  </ul>
                </div>
                {planSlug === 'enterprise' && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-teal-500 mt-4 text-center">Selected</span>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INVITE TEAM */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-teal-500" />
                <span>Invite Team Members</span>
              </h2>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">Send workspace invitation links to collaborate with your team.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Name (e.g. Alice)"
                    className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="h-10 px-2 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150 flex-grow"
                  >
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="FINANCE_MANAGER">Finance Manager</option>
                    <option value="ORG_ADMIN">Org Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={addInvite}
                    className="p-2.5 bg-brand-teal-500 text-white rounded-lg hover:opacity-90"
                    title="Add Member"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Invited List */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {invites.length === 0 ? (
                  <p className="text-xs text-brand-slate-400 text-center py-6 border border-dashed border-brand-slate-200 dark:border-brand-slate-850 rounded-xl">
                    No invites added yet. You can invite team members now or skip this step.
                  </p>
                ) : (
                  invites.map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-brand-slate-100/50 dark:bg-brand-navy-950/20 border border-brand-slate-200/50 dark:border-brand-slate-850 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-brand-slate-800 dark:text-brand-slate-250">{inv.name}</p>
                        <p className="text-[10px] text-brand-slate-400">{inv.email} • <span className="text-brand-teal-500 font-semibold">{inv.role.replace('_', ' ')}</span></p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeInvite(idx)}
                        className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONNECT PAYMENT */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-teal-500" />
                <span>Connect Payment Method</span>
              </h2>
              {planSlug === 'free' ? (
                <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">You selected the Free Starter plan. No credit card is required to continue!</p>
              ) : (
                <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">Connect your billing method to active your <strong>Pro/Enterprise</strong> features.</p>
              )}
            </div>

            {planSlug === 'free' ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-brand-slate-200 dark:border-brand-slate-850 rounded-2xl bg-brand-teal-500/5 text-center">
                <Smile className="w-12 h-12 text-brand-teal-500 mb-3 animate-bounce" />
                <h3 className="font-bold text-sm text-brand-slate-800 dark:text-brand-slate-200">No payment method required</h3>
                <p className="text-[10px] text-brand-slate-400 mt-1 max-w-sm leading-relaxed">
                  Since you're starting on the free starter plan, you can connect cards or bank transfers later under Settings anytime you want to upgrade.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Method selector tabs */}
                <div className="flex items-center gap-2 bg-brand-slate-100 dark:bg-brand-navy-950/40 p-1.5 rounded-xl border border-brand-slate-200/50 dark:border-brand-slate-850">
                  {['CARD', 'UPI', 'BANK'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentType(method)}
                      className={`flex-grow py-2 text-xs font-semibold rounded-lg transition-all ${
                        paymentType === method 
                          ? 'bg-brand-teal-500 text-white shadow-glow-teal' 
                          : 'text-brand-slate-500 hover:text-brand-slate-800 dark:hover:text-brand-slate-200'
                      }`}
                    >
                      {method === 'CARD' ? 'Credit Card' : method === 'UPI' ? 'UPI / NetBanking' : 'Bank Account'}
                    </button>
                  ))}
                </div>

                {/* Form fields based on selected method */}
                {paymentType === 'CARD' && (
                  <div className="flex flex-col gap-3.5 p-4 border border-brand-slate-200/50 dark:border-brand-slate-850 rounded-2xl bg-white/20 dark:bg-brand-navy-900/10">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Johnathan Doe"
                        className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        maxLength="19"
                        className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Expiration Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength="5"
                          className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          maxLength="3"
                          className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentType === 'UPI' && (
                  <div className="flex flex-col gap-3 p-4 border border-brand-slate-200/50 dark:border-brand-slate-850 rounded-2xl bg-white/20 dark:bg-brand-navy-900/10">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Virtual Payment Address (VPA) / UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okaxis"
                        className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-brand-slate-400 mt-1 leading-relaxed">
                      You will receive a collect request on your UPI-linked mobile application to authorize this transaction.
                    </p>
                  </div>
                )}

                {paymentType === 'BANK' && (
                  <div className="flex flex-col gap-3.5 p-4 border border-brand-slate-200/50 dark:border-brand-slate-850 rounded-2xl bg-white/20 dark:bg-brand-navy-900/10">
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={bankAccNumber}
                        onChange={(e) => setBankAccNumber(e.target.value)}
                        placeholder="123456789012"
                        className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Routing / IFSC code</label>
                      <input
                        type="text"
                        value={bankRouting}
                        onChange={(e) => setBankRouting(e.target.value)}
                        placeholder="e.g. BARB0MUMBAI"
                        className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-850 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & FINISH */}
        {step === 5 && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <span className="p-3 bg-brand-teal-500/10 text-brand-teal-500 rounded-full inline-block mb-3 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </span>
              <h2 className="text-xl font-bold font-outfit text-brand-slate-800 dark:text-brand-slate-100">Ready to launch {orgName}!</h2>
              <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">Review your business workspace configuration and complete setup.</p>
            </div>

            <div className="p-5 border border-brand-slate-200/50 dark:border-brand-slate-850 rounded-2xl bg-white/20 dark:bg-brand-navy-900/10 flex flex-col gap-4 text-xs">
              
              {/* Org Details Summary */}
              <div className="flex items-center gap-4 pb-3.5 border-b border-brand-slate-200/50 dark:border-brand-slate-850">
                <img src={customLogoUrl.trim() || selectedLogo} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-brand-teal-500/20" />
                <div>
                  <h4 className="font-extrabold text-sm text-brand-slate-800 dark:text-brand-slate-200">{orgName}</h4>
                  <p className="text-[10px] text-brand-slate-400 mt-0.5">{industry} • {companySize} • {country}</p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 py-1 text-brand-slate-600 dark:text-brand-slate-400">
                <div>
                  <p className="text-[10px] font-bold text-brand-slate-400 uppercase">SELECTED PLAN</p>
                  <p className="font-semibold text-brand-slate-850 dark:text-brand-slate-200 mt-0.5">
                    {planSlug === 'free' ? 'Free Starter ($0)' : planSlug === 'pro' ? 'Pro Premium ($49/mo)' : 'Enterprise Shield ($299/mo)'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-brand-slate-400 uppercase">BILLING CURRENCY</p>
                  <p className="font-semibold text-brand-slate-850 dark:text-brand-slate-200 mt-0.5 font-mono">{currency}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-brand-slate-400 uppercase">TEAM SEATS INVITED</p>
                  <p className="font-semibold text-brand-slate-850 dark:text-brand-slate-200 mt-0.5">{invites.length} members pending</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-brand-slate-400 uppercase">PAYMENT CONNECTION</p>
                  <p className="font-semibold text-brand-slate-850 dark:text-brand-slate-200 mt-0.5">
                    {planSlug === 'free' ? 'None Required' : paymentType}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-brand-slate-400 text-center leading-relaxed max-w-md mx-auto">
              By completing setup, you automatically become the **Workspace Owner** and **Organization Admin** for this tenant account.
            </p>
          </div>
        )}

        {/* Action buttons footer */}
        <div className="flex items-center justify-between border-t border-brand-slate-200/50 dark:border-brand-slate-850 pt-6 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="px-4 h-11 flex items-center gap-1 text-xs font-semibold rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 hover:border-brand-teal-500/50 text-brand-slate-700 dark:text-brand-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 h-11 flex items-center gap-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white shadow-glow-teal hover:opacity-95 transition-opacity ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishSetup}
              disabled={loading}
              className="px-6 h-11 flex items-center gap-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-teal-500 to-brand-emerald-500 text-white shadow-glow-teal hover:opacity-95 transition-opacity ml-auto"
            >
              <span>{loading ? 'Initializing Workspace...' : 'Complete & Launch Workspace'}</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
