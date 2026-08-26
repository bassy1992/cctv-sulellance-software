import React from 'react';
import { StorageStatus } from '../../types';
import { HardDrive, AlertTriangle, Database, Folder, Clock, ShieldAlert } from 'lucide-react';

interface StorageCardProps {
  storage: StorageStatus;
  onOpenRetentionModal?: () => void;
  onRunCleanup?: () => void;
  isCleaning?: boolean;
}

export const StorageCard: React.FC<StorageCardProps> = ({
  storage,
  onOpenRetentionModal,
  onRunCleanup,
  isCleaning = false
}) => {
  const isCritical = storage.percentageUsed >= 90;
  const isWarning = storage.percentageUsed >= storage.warningThresholdPercent;

  return (
    <div className="space-y-4 text-gray-200">
      {/* High Storage Alert Warning Banner */}
      {isWarning && (
        <div
          id="storage-warning-alert"
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
            isCritical
              ? 'bg-red-950/50 border-red-500/50 text-red-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`}
            />
            <div>
              <h4 className="font-bold text-sm">
                {isCritical ? 'CRITICAL: Surveillance Disk Nearing Capacity' : 'Storage Capacity Alert'}
              </h4>
              <p className="text-xs text-gray-300 mt-1">
                Hard drive usage is at <span className="font-bold">{storage.percentageUsed}%</span>. Only{' '}
                <span className="font-bold">{storage.availableSpaceGB.toFixed(0)} GB</span> remains on drive{' '}
                <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-[11px] border border-white/10">{storage.storageDrive}</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRunCleanup && (
              <button
                id="quick-cleanup-btn"
                onClick={onRunCleanup}
                disabled={isCleaning}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCleaning ? 'Pruning...' : 'Auto-Prune Expired'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Storage Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disk Card */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disk Space</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              {(storage.totalSpaceGB / 1000).toFixed(1)} TB
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {storage.totalSpaceGB} GB Dedicated Volume
            </p>
          </div>
        </div>

        {/* Used Disk Card */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Used Space</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              {storage.usedSpaceGB.toFixed(0)} GB
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {storage.percentageUsed}% of Total Volume
            </p>
          </div>
        </div>

        {/* Available Disk Card */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Space</span>
            <HardDrive className="w-4 h-4 text-green-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-green-400">
              {storage.availableSpaceGB.toFixed(0)} GB
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              Estimated ~{(storage.availableSpaceGB / 45).toFixed(0)} days continuous recording
            </p>
          </div>
        </div>

        {/* Recordings & Retention Card */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Retention Policy</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              {storage.retentionDays} Days
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {storage.totalRecordingsCount} clips currently archived
            </p>
          </div>
        </div>
      </div>

      {/* Storage Progress Bar */}
      <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 space-y-2 shadow-xs">
        <div className="flex justify-between text-xs font-medium text-gray-300">
          <span className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-mono">{storage.storageDrive}</span>
          </span>
          <span className="font-mono text-gray-400">
            {storage.usedSpaceGB.toFixed(0)} GB / {storage.totalSpaceGB} GB ({storage.percentageUsed}%)
          </span>
        </div>

        <div className="w-full h-3 bg-[#0A0C10] rounded-full overflow-hidden p-0.5 border border-[#242933]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? 'bg-red-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, storage.percentageUsed)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
