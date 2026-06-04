// client/src/pages/Subscriptions.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Check, ShieldAlert, Award, Calendar, RefreshCw } from 'lucide-react';

export default function Subscriptions() {
  const { role, activeOrg } = useAuthStore();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);

  const loadSubData = async () => {
    setLoading(true);
    try {
      const plansList = await apiRequest('/api/subscriptions/plans');
      setPlans(plansList);

      const sub = await apiRequest('/api/subscriptions/active');
      setActiveSub(sub);
      
      // Infer billing cycle
      if (sub && sub.plan) {
        const isYearly = Math.abs((new Date(sub.currentPeriodEnd) - new Date(sub.currentPeriodStart)) / (1000 * 60 * 60 * 24)) > 40;
        setBillingCycle(isYearly ? 'yearly' : 'monthly');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubData();
  }, [activeOrg]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      const res = await apiRequest('/api/subscriptions/coupon', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode })
      });
      setActiveCoupon(res);
      addToast(`Applied coupon: ${res.code} (${res.discount}% off)`, 'success');
      setCouponCode('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePlanChange = async (planId) => {
    if (role !== 'ORG_ADMIN') {
      return addToast('Only Organization Administrators can modify subscriptions.', 'warning');
    }
    
    try {
      const res = await apiRequest('/api/subscriptions/change', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle })
      });

      addToast(`Plan changed successfully! Invoice generated.`, 'success');
      setActiveCoupon(null);
      loadSubData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleToggleAutoRenew = async () => {
    if (role !== 'ORG_ADMIN') {
      return addToast('Only Organization Administrators can toggle billing renewals.', 'warning');
    }
    try {
      const res = await apiRequest('/api/subscriptions/cancel', { method: 'POST' });
      setActiveSub(res);
      addToast(res.cancelAtPeriodEnd ? 'Auto-renew disabled. Sub expires at period end.' : 'Auto-renew enabled.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-28 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
        <div className="h-64 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Current Active Plan Overview */}
      <div className="glass-card p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 bg-gradient-to-r from-brand-teal-500/5 to-brand-cyan-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-brand-teal-500/10 text-brand-teal-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-brand-teal-500/10 text-brand-teal-500 rounded-full uppercase tracking-wider">
              {activeSub?.status}
            </span>
            <h2 className="text-xl font-bold font-outfit mt-1">{activeSub?.plan?.name}</h2>
            <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400 mt-1">
              Next Invoice Date: <span className="font-semibold text-brand-slate-700 dark:text-brand-slate-200">{new Date(activeSub?.currentPeriodEnd).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
          {activeSub?.plan?.slug !== 'free' && (
            <button
              onClick={handleToggleAutoRenew}
              className={`px-4 h-10 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                activeSub?.cancelAtPeriodEnd
                  ? 'border-brand-emerald-500/20 bg-brand-emerald-50/50 dark:bg-brand-emerald-950/10 text-brand-emerald-500'
                  : 'border-red-500/20 bg-red-50/50 dark:bg-red-950/10 text-red-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{activeSub?.cancelAtPeriodEnd ? 'Re-enable Auto Renew' : 'Cancel Auto Renew'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Warning */}
      {role !== 'ORG_ADMIN' && (
        <div className="p-4 rounded-xl border border-brand-slate-200 dark:border-brand-slate-800 bg-brand-slate-100/50 dark:bg-brand-slate-900/30 text-brand-slate-500 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-slate-400 flex-shrink-0" />
          <span>You have a read-only role ({role?.replace('_', ' ')}). You cannot execute subscription updates.</span>
        </div>
      )}

      {/* Plans Matrix */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold font-outfit">Pricing Tiers Matrix</h2>
            <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400">Choose a package to fit your organization's limits.</p>
          </div>

          {/* Cycles selection */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-brand-teal-500' : 'text-brand-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-10 h-5.5 rounded-full bg-brand-slate-200 dark:bg-brand-slate-800 p-0.5 flex items-center transition-colors"
              aria-label="Toggle cycle"
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-brand-teal-500 transition-transform ${billingCycle === 'yearly' ? 'translate-x-4.5' : ''}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-brand-teal-500' : 'text-brand-slate-500'}`}>Yearly (20% Off)</span>
          </div>
        </div>

        {/* Pricing columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isActive = plan.id === activeSub?.planId;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const finalPrice = activeCoupon ? Math.round(price * (1 - activeCoupon.discount / 100) * 100) / 100 : price;

            return (
              <div
                key={plan.id}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between ${
                  isActive
                    ? 'border-brand-teal-500 bg-brand-teal-500/5 dark:bg-brand-teal-950/10'
                    : 'border-brand-slate-200/50 dark:border-brand-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold font-outfit">{plan.name}</h3>
                    {isActive && (
                      <span className="px-2 py-0.5 text-[8px] bg-brand-teal-500 text-white rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-slate-500 dark:text-brand-slate-400 mb-4 h-10 overflow-hidden leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-extrabold font-outfit">
                      ${finalPrice}
                    </span>
                    <span className="text-[10px] text-brand-slate-500">/ {billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                    {activeCoupon && (
                      <span className="text-[9px] text-brand-emerald-500 font-bold ml-1 bg-brand-emerald-500/10 px-1 rounded">
                        -{activeCoupon.discount}%
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2.5 mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-brand-slate-650 dark:text-brand-slate-350">
                        <Check className="w-3.5 h-3.5 text-brand-teal-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={isActive || role !== 'ORG_ADMIN'}
                  className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-400 cursor-default'
                      : 'bg-brand-slate-950 dark:bg-white text-white dark:text-brand-navy-950 hover:opacity-90'
                  }`}
                >
                  {isActive ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupons Application Section */}
      {role === 'ORG_ADMIN' && (
        <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 max-w-md">
          <h3 className="text-sm font-bold font-outfit mb-1">Apply Discount Coupon</h3>
          <p className="text-[10px] text-brand-slate-500 dark:text-brand-slate-400 mb-4">
            Enter a sandbox code to test coupon-based price reductions (e.g. <span className="font-bold text-brand-teal-500">BILLORA50</span>, <span className="font-bold text-brand-teal-500">GROWTH20</span>).
          </p>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="COUPON50"
              className="px-3 text-xs h-10 rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 flex-grow uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 h-10 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-lg hover:opacity-90"
            >
              Apply
            </button>
          </form>
          {activeCoupon && (
            <p className="text-[10px] text-brand-emerald-500 mt-2 font-bold">
              ✓ Active discount: {activeCoupon.code} - {activeCoupon.description} ({activeCoupon.discount}% discount applied)
            </p>
          )}
        </div>
      )}

    </div>
  );
}
