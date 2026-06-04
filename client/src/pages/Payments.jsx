// client/src/pages/Payments.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { CreditCard, Search, ArrowRight, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Payments() {
  const { activeOrg, role } = useAuthStore();
  const { addToast } = useToastStore();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Refund Modal State
  const [refundingPayment, setRefundingPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/billing/payments');
      setPayments(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [activeOrg]);

  const handleRefund = async (e) => {
    e.preventDefault();
    if (role !== 'ORG_ADMIN' && role !== 'FINANCE_MANAGER') {
      return addToast('Only Finance Managers and Organization Admins can process refunds.', 'warning');
    }

    if (!refundReason) return addToast('Please specify a refund reason.', 'warning');

    try {
      await apiRequest(`/api/billing/refund/${refundingPayment.id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason })
      });
      addToast('Refund processed successfully!', 'success');
      setRefundingPayment(null);
      setRefundReason('');
      loadPayments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-xl" />
        <div className="h-48 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search and stats header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-slate-400" />
          <input
            type="text"
            placeholder="Search by transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white/50 dark:bg-brand-navy-950/40 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10">
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Transaction ID</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Date</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Payment Method</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Amount</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Status</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors last:border-none">
                  <td className="p-4 font-mono text-[11px] font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-slate-400" />
                    <span>{pay.transactionId}</span>
                  </td>
                  <td className="p-4 text-brand-slate-500">{new Date(pay.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">{pay.paymentMethod}</td>
                  <td className="p-4 font-bold text-brand-slate-800 dark:text-brand-slate-100">${pay.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-start">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        pay.status === 'SUCCESS'
                          ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                          : pay.status === 'FAILED'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {pay.status}
                      </span>
                      {pay.refundReason && (
                        <span className="text-[9px] text-brand-slate-400 mt-1 italic">Reason: {pay.refundReason}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {pay.status === 'SUCCESS' && (role === 'ORG_ADMIN' || role === 'FINANCE_MANAGER') && (
                      <button
                        onClick={() => setRefundingPayment(pay)}
                        className="px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 font-bold text-[10px] transition-all flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Refund</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-brand-slate-400">No payment transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {refundingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/70 backdrop-blur-xs dialog-overlay">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-brand-slate-200 dark:border-brand-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit flex items-center gap-1 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Process Refund</span>
              </h3>
              <button onClick={() => setRefundingPayment(null)} className="p-1 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-850 rounded-lg text-brand-slate-400">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <p className="text-[11px] text-brand-slate-500 dark:text-brand-slate-400 leading-relaxed">
              You are initiating a refund of <span className="font-bold text-brand-slate-700 dark:text-brand-slate-200">${refundingPayment.amount.toFixed(2)}</span> for transaction <code className="font-mono text-[10px] text-brand-teal-500">{refundingPayment.transactionId}</code>.
            </p>

            <form onSubmit={handleRefund} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Reason for Refund</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Duplicate charge, customer request"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors mt-2"
              >
                Approve Sandbox Refund
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
