// client/src/components/ui/ToastContainer.jsx
import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl flex items-start gap-3 glass-panel border shadow-lg ${
                isSuccess
                  ? 'border-brand-emerald-500/20 text-brand-emerald-800 dark:text-brand-emerald-400 bg-brand-emerald-500/10 dark:bg-brand-emerald-950/20'
                  : isError
                  ? 'border-red-500/20 text-red-800 dark:text-red-400 bg-red-500/10 dark:bg-red-950/20'
                  : isWarning
                  ? 'border-amber-500/20 text-amber-800 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/20'
                  : 'border-brand-cyan-500/20 text-brand-cyan-800 dark:text-brand-cyan-400 bg-brand-cyan-500/10 dark:bg-brand-cyan-950/20'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle className="w-5 h-5 text-brand-emerald-500" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-brand-cyan-500" />}
              </div>
              <div className="flex-grow text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
