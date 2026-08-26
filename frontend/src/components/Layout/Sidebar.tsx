import React from 'react';
import {
  LayoutDashboard,
  Video,
  Film,
  Camera as CameraIcon,
  HardDrive,
  Settings,
  Shield,
  Radio,
  Cpu
} from 'lucide-react';
import { Camera, StorageStatus } from '../../types';

export type ActivePage = 'dashboard' | 'live' | 'recordings' | 'cameras' | 'storage' | 'settings';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  cameras: Camera[];
  storage: StorageStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  cameras,
  storage
}) => {
  const onlineCount = cameras.filter(c => c.status === 'ONLINE').length;
  const recordingCount = cameras.filter(c => c.isRecording).length;

  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'live' as ActivePage,
      label: 'Live Cameras',
      icon: <Video className="w-4 h-4" />,
      badge: (
        <span className="flex items-center gap-1.5">
          {recordingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#1A1E26] text-emerald-400 rounded border border-[#242933]">
            {onlineCount}/{cameras.length}
          </span>
        </span>
      )
    },
    {
      id: 'recordings' as ActivePage,
      label: 'Recordings',
      icon: <Film className="w-4 h-4" />,
      badge: (
        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1A1E26] text-gray-300 rounded border border-[#242933]">
          {storage.totalRecordingsCount}
        </span>
      )
    },
    {
      id: 'cameras' as ActivePage,
      label: 'Cameras',
      icon: <CameraIcon className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'storage' as ActivePage,
      label: 'Storage',
      icon: <HardDrive className="w-4 h-4" />,
      badge: (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
            storage.isWarning
              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
              : 'bg-[#1A1E26] text-gray-400 border border-[#242933]'
          }`}
        >
          {storage.percentageUsed}%
        </span>
      )
    },
    {
      id: 'settings' as ActivePage,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      badge: null
    }
  ];

  return (
    <aside
      id="surveillance-sidebar"
      className="w-64 bg-[#11141B] border-r border-[#242933] flex flex-col justify-between select-none shrink-0"
    >
      {/* Top Branding Section */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-[#242933]">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg text-white">Yarquah Family Surveillance</span>
            <p className="text-[10px] font-mono text-gray-500 tracking-wider">
              VMS DESKTOP EDITION
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase mb-1">
            Surveillance Hub
          </div>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-xs'
                    : 'text-gray-400 hover:bg-[#1A1E26] hover:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-400' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Desktop System Info Box */}
      <div className="p-4 border-t border-[#242933] bg-[#11141B] space-y-3">
        {/* Quick Storage Status */}
        <div className="bg-[#161921] border border-[#242933] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Local Storage</span>
            </span>
            <span className="font-mono text-gray-200 font-bold">{storage.percentageUsed}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0C10] rounded-full overflow-hidden border border-[#242933]/50">
            <div
              className={`h-full rounded-full ${
                storage.isWarning ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${storage.percentageUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>{storage.availableSpaceGB.toFixed(0)} GB Free</span>
            <span>{storage.totalSpaceGB} GB Total</span>
          </div>
        </div>

        {/* FFmpeg Process Status */}
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-xs text-gray-300">FFmpeg Local Core</span>
          </div>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">READY</span>
        </div>
      </div>
    </aside>
  );
};
