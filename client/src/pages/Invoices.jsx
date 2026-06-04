// client/src/pages/Invoices.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Search, Receipt, Download, AlertCircle, CheckCircle, Clock, CreditCard } from 'lucide-react';

export default function Invoices() {
  const { activeOrg, role } = useAuthStore();
  const { addToast } = useToastStore();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Simulation Modal State
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD (•••• 4242)');

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const url = `/api/invoices?status=${statusFilter}&search=${searchQuery}`;
      const res = await apiRequest(url);
      setInvoices(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [activeOrg, statusFilter, searchQuery]);

  const handlePayInvoice = async () => {
    if (!payingInvoice) return;
    try {
      await apiRequest('/api/billing/process-payment', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: payingInvoice.id,
          paymentMethod
        })
      });
      addToast(`Invoice ${payingInvoice.invoiceNumber} paid successfully!`, 'success');
      setPayingInvoice(null);
      loadInvoices();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const downloadMockPDF = (invoice) => {
    // Generate a simple text file formatting representing a PDF invoice
    const content = `
==================================================
                 BILLORA INVOICE
==================================================
Invoice Number : ${invoice.invoiceNumber}
Date Generated : ${new Date(invoice.createdAt).toLocaleDateString()}
Due Date       : ${new Date(invoice.dueDate).toLocaleDateString()}
Organization   : ${activeOrg?.name}
Status         : ${invoice.status.toUpperCase()}
==================================================
Description                    Amount       Tax (18%)
Subscription Cycle Renewal    $${invoice.amount.toFixed(2)}    $${invoice.tax.toFixed(2)}
==================================================
TOTAL DUE                                  $${invoice.total.toFixed(2)}
==================================================
Thank you for using Billora. For queries, contact support@billora.com.
    `;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Invoice ${invoice.invoiceNumber} downloaded!`, 'success');
  };

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
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white/50 dark:bg-brand-navy-950/40 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[
            { value: '', label: 'All Invoices' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'OVERDUE', label: 'Overdue' }
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === btn.value
                  ? 'border-brand-teal-500/30 bg-brand-teal-500/10 text-brand-teal-550 dark:text-brand-teal-400'
                  : 'border-brand-slate-200/50 dark:border-brand-slate-800 bg-white/50 dark:bg-brand-navy-950/40 text-brand-slate-500 hover:text-brand-slate-700 dark:hover:text-brand-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* Invoices List Table */}
      <div className="glass-card border border-brand-slate-200/50 dark:border-brand-slate-900 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10">
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Invoice Number</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Due Date</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Amount</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Tax (18%)</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Total</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase">Status</th>
                <th className="p-4 font-bold text-brand-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-brand-slate-200/40 dark:border-brand-slate-800/10 hover:bg-brand-slate-200/10 dark:hover:bg-brand-slate-900/10 transition-colors last:border-none">
                  <td className="p-4 font-bold font-mono text-[11px] flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand-slate-400" />
                    <span>{inv.invoiceNumber}</span>
                  </td>
                  <td className="p-4 text-brand-slate-600 dark:text-brand-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-4 text-brand-slate-700 dark:text-brand-slate-300 font-semibold">${inv.amount.toFixed(2)}</td>
                  <td className="p-4 text-brand-slate-500">${inv.tax.toFixed(2)}</td>
                  <td className="p-4 text-brand-slate-800 dark:text-brand-slate-100 font-bold">${inv.total.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full inline-flex items-center gap-0.5 ${
                      inv.status === 'PAID'
                        ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                        : inv.status === 'PENDING'
                        ? 'bg-brand-cyan-500/10 text-brand-cyan-550 dark:text-brand-cyan-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {inv.status === 'PAID' && <CheckCircle className="w-2.5 h-2.5" />}
                      {inv.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                      {inv.status === 'OVERDUE' && <AlertCircle className="w-2.5 h-2.5" />}
                      <span>{inv.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => downloadMockPDF(inv)}
                        className="p-2 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40 text-brand-slate-500 hover:text-brand-slate-850 dark:hover:text-brand-slate-200 transition-colors"
                        title="Download Statement"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.status !== 'PAID' && (role === 'ORG_ADMIN' || role === 'FINANCE_MANAGER') && (
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-[10px] hover:opacity-90"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-brand-slate-400">No matching invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Invoice Dialog Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/70 backdrop-blur-xs dialog-overlay">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-brand-slate-200 dark:border-brand-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit">SaaS Billing Checkout</h3>
              <button onClick={() => setPayingInvoice(null)} className="p-1 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-850 rounded-lg text-brand-slate-400">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-brand-slate-200 dark:border-brand-slate-800/30 bg-brand-slate-100/50 dark:bg-brand-navy-950/20 text-xs">
              <p className="text-[10px] text-brand-slate-500">PAYING INVOICE</p>
              <h4 className="font-mono font-bold mt-0.5">{payingInvoice.invoiceNumber}</h4>
              <hr className="border-brand-slate-200 dark:border-brand-slate-800 my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Charge:</span>
                <span className="text-brand-teal-500">${payingInvoice.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-slate-500 uppercase tracking-wider">Select Checkout Method</label>
              {[
                { value: 'CARD (•••• 4242)', label: 'Default Visa ending 4242', icon: CreditCard },
                { value: 'UPI (acme@okaxis)', label: 'UPI Address (acme@okaxis)', icon: CreditCard }
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <label 
                    key={method.value} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-brand-teal-500/40 transition-colors ${
                      paymentMethod === method.value 
                        ? 'border-brand-teal-500 bg-brand-teal-500/5 text-brand-teal-500' 
                        : 'border-brand-slate-200 dark:border-brand-slate-800 bg-transparent text-brand-slate-700 dark:text-brand-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_option"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="hidden"
                    />
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{method.label}</span>
                  </label>
                );
              })}
            </div>

            <button
              onClick={handlePayInvoice}
              className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95 mt-2"
            >
              Confirm Sandbox Payment
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
