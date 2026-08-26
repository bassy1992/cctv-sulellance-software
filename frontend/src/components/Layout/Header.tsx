import React from 'react';
import { useSystemClock } from '../../hooks/useSystemClock';
import { SystemHealth, Camera } from '../../types';
import { StatusIndicator } from '../Common/StatusIndicator';
import {
  Clock,
  Server,
  Video,
  Monitor,
  User,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface HeaderProps {
  health: SystemHealth;
  cameras: Camera[];
}

export const Header: React.FC<HeaderProps> = ({ health, cameras }) => {
  const { formattedDate, formattedTime } = useSystemClock();
  const activeRecordings = cameras.filter(c => c.isRecording).length;

  return (
    <header
      id="surveillance-app-header"
      className="h-16 bg-[#11141B] border-b border-[#242933] px-8 flex items-center justify-between gap-4 select-none shrink-0"
    >
      {/* Left: App Title, Clock & Backend Server Status */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-400">
          <span className="block text-[10px] uppercase font-semibold tracking-widest text-gray-500">
            Local Server Time
          </span>
          <span className="font-mono text-white text-base">
            {formattedDate} <span className="text-emerald-400 font-bold">{formattedTime}</span>
          </span>
        </div>

        <div className="h-8 w-px bg-[#242933] hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-xs sm:text-sm font-medium text-gray-200">
            System Healthy ({health.onlineCameras}/{health.totalCameras} Online)
          </span>
        </div>
      </div>

      {/* Right: Active Recording Pill & User Workstation Badge */}
      <div className="flex items-center gap-4">
        {/* Active Recording Pill */}
        <div
          id="recording-status-ticker"
          className={`px-3 py-1.5 rounded border border-[#242933] flex items-center gap-2 transition-all ${
            activeRecordings > 0
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-[#1A1E26] text-gray-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeRecordings > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
            }`}
          />
          <span className="text-xs font-mono text-white">
            {activeRecordings > 0 ? `REC: ${activeRecordings} ACTIVE` : 'REC: IDLE'}
          </span>
        </div>

        {/* Local Desktop Station Badge */}
        <div
          id="user-profile-badge"
          className="flex items-center gap-3 pl-4 border-l border-[#242933]"
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            AD
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-medium text-gray-200">Admin User</p>
            <p className="text-[10px] text-green-500 uppercase font-bold tracking-wider">Authorized</p>
          </div>
        </div>
      </div>
    </header>
  );
};
