import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

export const toast = {
  success: (title: string, message?: string, duration = 3500) => {
    emitToast('success', title, message, duration);
  },
  error: (title: string, message?: string, duration = 5000) => {
    emitToast('error', title, message, duration);
  },
  info: (title: string, message?: string, duration = 3000) => {
    emitToast('info', title, message, duration);
  },
  warn: (title: string, message?: string, duration = 4000) => {
    emitToast('warn', title, message, duration);
  },
};

function emitToast(type: ToastType, title: string, message?: string, duration = 3500) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: ToastMessage = { id, type, title, message, duration };
  listeners.forEach((l) => l(item));
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (t) => {
      setToasts((prev) => [...prev, t]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, t.duration || 3500);
      return () => clearTimeout(timer);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none font-sans">
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isSuccess = t.type === 'success';
        const isWarn = t.type === 'warn';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-150 flex items-start gap-2.5 ${
              isError
                ? 'bg-obsidian-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/40'
                : isSuccess
                ? 'bg-obsidian-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40'
                : isWarn
                ? 'bg-obsidian-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/40'
                : 'bg-obsidian-900/95 border-white/[0.12] text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-4 h-4 text-cyber-rose" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-cyber-green" />}
              {isWarn && <AlertTriangle className="w-4 h-4 text-cyber-amber" />}
              {!isError && !isSuccess && !isWarn && <Info className="w-4 h-4 text-cyber-indigo" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold tracking-tight">{t.title}</div>
              {t.message && (
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words font-sans">
                  {t.message}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
