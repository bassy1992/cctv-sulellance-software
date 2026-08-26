import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'System Alert',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div
      id="error-message-banner"
      className={`bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-4 text-red-300 ${className}`}
    >
      <div className="p-2 bg-red-500/20 rounded-lg shrink-0 mt-0.5">
        <AlertOctagon className="w-5 h-5 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-red-200">{title}</h4>
        <p className="text-xs text-red-300/80 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            id="error-retry-btn"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium rounded-lg transition-colors border border-red-500/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};
