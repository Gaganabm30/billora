// client/src/pages/Notifications.jsx
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Bell, CheckCircle, Clock, Trash2, ShieldAlert } from 'lucide-react';

export default function Notifications() {
  const { notifications, fetchNotifications, markNotificationRead, markAllNotificationsRead } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-outfit">Notification Center</h1>
          <p className="text-xs text-brand-slate-500">Monitor important updates regarding billing, invoices, and tickets.</p>
        </div>
        {notifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-brand-teal-500 hover:underline flex items-center gap-1"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex flex-col gap-3">
        {notifications.map((notif) => {
          const isFailed = notif.type === 'PAYMENT_FAILED';
          const isInvoice = notif.type === 'INVOICE_GENERATED';
          
          return (
            <div
              key={notif.id}
              onClick={() => !notif.read && markNotificationRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                notif.read
                  ? 'border-brand-slate-200/50 dark:border-brand-slate-900 bg-white/40 dark:bg-brand-navy-950/10 opacity-70'
                  : 'border-brand-teal-500/20 bg-brand-teal-500/5 dark:bg-brand-teal-950/5 shadow-sm'
              }`}
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                isFailed
                  ? 'bg-red-500/10 text-red-500'
                  : isInvoice
                  ? 'bg-brand-cyan-500/10 text-brand-cyan-500'
                  : 'bg-brand-teal-500/10 text-brand-teal-500'
              }`}>
                {isFailed ? <ShieldAlert className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xs font-bold text-brand-slate-800 dark:text-brand-slate-200">{notif.title}</h3>
                  <span className="text-[9px] text-brand-slate-400 font-medium">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-brand-slate-500 dark:text-brand-slate-400 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                {!notif.read && (
                  <span className="inline-block text-[8px] text-brand-teal-555 font-bold uppercase mt-2 tracking-wider">
                    Click to mark read
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-12 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl text-xs text-brand-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <span>You have no notifications.</span>
          </div>
        )}
      </div>

    </div>
  );
}
