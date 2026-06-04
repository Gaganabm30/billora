// client/src/pages/Billing.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { CreditCard, Plus, Trash, ShieldCheck, Wallet, Sparkles, Check } from 'lucide-react';

export default function Billing() {
  const { role, activeOrg } = useAuthStore();
  const { addToast } = useToastStore();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  // UPI Preference State
  const [upiId, setUpiId] = useState('acme@okaxis');
  const [isEditingUpi, setIsEditingUpi] = useState(false);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/billing/cards');
      setCards(res);
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [activeOrg]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (role !== 'ORG_ADMIN') {
      return addToast('Only Organization Administrators can manage saved cards.', 'warning');
    }
    
    if (!cardNumber || !cardExp || !cardCvc || !cardName) {
      return addToast('Please fill out all card fields.', 'warning');
    }

    const [month, year] = cardExp.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      return addToast('Expiration must be in MM/YY format.', 'warning');
    }

    try {
      await apiRequest('/api/billing/cards', {
        method: 'POST',
        body: JSON.stringify({
          number: cardNumber.replace(/\s/g, ''),
          expMonth: parseInt(month),
          expYear: parseInt(`20${year}`),
          cvc: cardCvc,
          name: cardName
        })
      });

      addToast('Card saved successfully!', 'success');
      setCardNumber('');
      setCardName('');
      setCardExp('');
      setCardCvc('');
      setShowAddCard(false);
      loadCards();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveUpi = () => {
    if (role !== 'ORG_ADMIN') return addToast('Only Organization Admins can edit payment profiles.', 'warning');
    setIsEditingUpi(false);
    addToast('UPI details updated successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-28 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
        <div className="h-40 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Cards List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold font-outfit">Saved Payment Cards</h2>
            <p className="text-xs text-brand-slate-500 dark:text-brand-slate-400">Cards used for automated invoice renewals.</p>
          </div>
          {role === 'ORG_ADMIN' && (
            <button
              onClick={() => setShowAddCard(true)}
              className="px-3 h-9 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="glass-panel p-6 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-brand-slate-100/50 to-brand-slate-200/20 dark:from-brand-navy-950/40 dark:to-brand-slate-900/10 min-h-[140px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-slate-400 dark:text-brand-slate-500 uppercase tracking-wider">Credit Card</p>
                  <p className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-350 mt-1">{card.brand}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-teal-500/10 text-brand-teal-500">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-widest text-brand-slate-800 dark:text-brand-slate-100">•••• •••• •••• {card.last4}</h3>
                  <p className="text-[10px] text-brand-slate-400 mt-1">Exp: {card.expMonth.toString().padStart(2, '0')}/{card.expYear.toString().slice(-2)}</p>
                </div>
                
                {card.isDefault && (
                  <span className="px-2 py-0.5 text-[8px] bg-brand-emerald-500/10 text-brand-emerald-500 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                    <span>Default</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {cards.length === 0 && (
            <div className="sm:col-span-2 text-center p-8 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl text-xs text-brand-slate-400">
              No saved payment cards are on file.
            </div>
          )}
        </div>
      </div>

      {/* UPI Details Section */}
      <div className="glass-panel p-6 border border-brand-slate-200/50 dark:border-brand-slate-900 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-cyan-500/10 text-brand-cyan-500 rounded-xl">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-outfit">UPI Payment Profile</h3>
            <p className="text-[10px] text-brand-slate-400">Alternate checkout option details.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isEditingUpi ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="org@okaxis"
                className="px-3 text-xs h-10 rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 flex-grow font-mono"
              />
              <button
                onClick={handleSaveUpi}
                className="px-4 h-10 bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold text-xs rounded-lg"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border border-brand-slate-200 dark:border-brand-slate-800/40 p-3.5 rounded-xl bg-brand-slate-100/30 dark:bg-brand-navy-950/20">
              <span className="text-xs font-mono text-brand-slate-700 dark:text-brand-slate-300">{upiId}</span>
              {role === 'ORG_ADMIN' && (
                <button
                  onClick={() => setIsEditingUpi(true)}
                  className="text-[10px] text-brand-teal-500 font-semibold hover:underline"
                >
                  Edit UPI
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/70 backdrop-blur-xs dialog-overlay">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-brand-slate-200 dark:border-brand-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit">Add Card Details</h3>
              <button onClick={() => setShowAddCard(false)} className="p-1 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-850 rounded-lg text-brand-slate-400">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Expiration</label>
                  <input
                    type="text"
                    required
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">CVC Code</label>
                  <input
                    type="password"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="•••"
                    maxLength={3}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95 mt-2"
              >
                Save Payment Card
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
