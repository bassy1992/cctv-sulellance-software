import React from 'react';
import { CameraStatus, RecordingStatus } from '../../types';

interface StatusIndicatorProps {
  status: CameraStatus | RecordingStatus | 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR' | 'RECORDING' | 'COMPLETED' | 'FAILED';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'ONLINE':
      case 'COMPLETED':
        return {
          colorBg: 'bg-green-500/10 text-green-400 border-green-500/30',
          dotBg: 'bg-green-500',
          pulse: false,
          label: 'ONLINE'
        };
      case 'RECORDING':
        return {
          colorBg: 'bg-red-500/15 text-red-400 border-red-500/30',
          dotBg: 'bg-red-500',
          pulse: true,
          label: 'RECORDING'
        };
      case 'CONNECTING':
        return {
          colorBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotBg: 'bg-amber-500',
          pulse: true,
          label: 'CONNECTING'
        };
      case 'OFFLINE':
        return {
          colorBg: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
          dotBg: 'bg-gray-500',
          pulse: false,
          label: 'OFFLINE'
        };
      case 'ERROR':
      case 'FAILED':
        return {
          colorBg: 'bg-red-500/10 text-red-400 border-red-500/30',
          dotBg: 'bg-red-500',
          pulse: false,
          label: 'ERROR'
        };
      default:
        return {
          colorBg: 'bg-[#161921] text-gray-400 border-[#242933]',
          dotBg: 'bg-gray-400',
          pulse: false,
          label: status
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2.5 font-medium'
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  return (
    <span
      id={`status-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border ${config.colorBg} ${sizeClasses} ${className}`}
    >
      <span className="relative flex items-center justify-center">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotBg}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotSizes} ${config.dotBg}`} />
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
