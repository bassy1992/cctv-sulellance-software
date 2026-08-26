import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
        };

        const bgColors = {
          success: 'bg-[#11141B] border-green-500/40 text-white shadow-2xl',
          warning: 'bg-[#11141B] border-amber-500/40 text-white shadow-2xl',
          error: 'bg-[#11141B] border-red-500/40 text-white shadow-2xl',
          info: 'bg-[#11141B] border-blue-500/40 text-white shadow-2xl'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-5 ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold">{toast.title}</h5>
              <p className="text-xs text-gray-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
