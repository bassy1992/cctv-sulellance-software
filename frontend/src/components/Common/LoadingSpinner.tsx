import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4'
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div
        className={`${sizeClasses} border-slate-700 border-t-blue-500 rounded-full animate-spin mb-3`}
      />
      {message && <p className="text-xs font-mono text-slate-400 tracking-wide">{message}</p>}
    </div>
  );
};
