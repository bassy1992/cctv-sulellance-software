import React, { useState } from 'react';
import { StorageStatus } from '../types';
import { StorageCard } from '../components/Storage/StorageCard';
import { StorageChart } from '../components/Storage/StorageChart';
import { RetentionModal } from '../components/Storage/RetentionModal';
import {
  HardDrive,
  Clock,
  Trash2,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface StorageProps {
  storage: StorageStatus;
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onUpdateRetention: (days: number) => Promise<any>;
  onRunCleanup: () => Promise<any>;
  isUpdating?: boolean;
}

export const Storage: React.FC<StorageProps> = ({
  storage,
  loading,
  error,
  onRefresh,
  onUpdateRetention,
  onRunCleanup,
  isUpdating = false
}) => {
  const [isRetentionOpen, setIsRetentionOpen] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deletedCount: number; freedGB: number } | null>(null);

  const handleCleanup = async () => {
    try {
      const res = await onRunCleanup();
      setCleanupResult(res);
      setTimeout(() => setCleanupResult(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-sm text-red-200">
          Storage data unavailable: {error}
        </div>
      )}
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">
              Local Storage & Retention Management
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Windows Hard Drive
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor dedicated surveillance drive allocation, daily recording accumulation, and automatic retention policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-xl border border-[#242933] transition-colors cursor-pointer"
            title="Refresh Storage Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="configure-retention-btn"
            onClick={() => setIsRetentionOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Configure Retention ({storage.retentionDays} Days)</span>
          </button>
        </div>
      </div>

      {/* Cleanup feedback banner */}
      {cleanupResult && (
        <div className="p-4 bg-green-950/50 border border-green-500/40 rounded-xl flex items-center gap-3 text-xs text-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <span className="font-bold">Cleanup Successful!</span> Purged {cleanupResult.deletedCount} expired video files and reclaimed {cleanupResult.freedGB} GB of disk space.
          </div>
        </div>
      )}

      {/* Primary Storage Metrics & Capacity Bar */}
      <StorageCard
        storage={storage}
        onOpenRetentionModal={() => setIsRetentionOpen(true)}
        onRunCleanup={handleCleanup}
        isCleaning={isUpdating}
      />

      {/* Deep Dive Metadata Cards: Storage Path, Date Ranges, Total Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drive Path & Specs */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span>Storage Location</span>
          </div>
          <div className="p-2.5 bg-[#0A0C10] rounded-lg border border-[#242933] text-xs font-mono text-gray-200 break-all">
            {storage.storageDrive}
          </div>
          <p className="text-[11px] text-gray-400">
            Local NTFS Volume • Direct FFmpeg recording sink
          </p>
        </div>

        {/* Oldest & Newest Archives */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Calendar className="w-4 h-4 text-green-400" />
            <span>Archive Range</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between p-2 bg-[#0A0C10] rounded border border-[#242933]">
              <span className="text-gray-400">Oldest Clip:</span>
              <span className="text-gray-300 font-semibold">{storage.oldestRecordingDate}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#0A0C10] rounded border border-[#242933]">
              <span className="text-gray-400">Newest Clip:</span>
              <span className="text-gray-300 font-semibold">{storage.newestRecordingDate}</span>
            </div>
          </div>
        </div>

        {/* Manual Purge & Actions */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Disk Maintenance</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Manually trigger immediate purge of video clips older than the {storage.retentionDays}-day retention policy.
            </p>
          </div>

          <button
            id="manual-storage-cleanup-btn"
            onClick={handleCleanup}
            disabled={isUpdating}
            className="w-full py-2 bg-[#161921] hover:bg-[#1A1E26] text-gray-200 text-xs font-semibold rounded-lg border border-[#242933] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Executing Disk Purge...' : 'Purge Old Files Now'}</span>
          </button>
        </div>
      </div>

      {/* Storage Visual Charts: Daily Trend & Camera Breakdown */}
      <StorageChart storage={storage} />

      {/* Retention Policy Modal */}
      <RetentionModal
        isOpen={isRetentionOpen}
        onClose={() => setIsRetentionOpen(false)}
        currentDays={storage.retentionDays}
        onSave={onUpdateRetention}
        isLoading={isUpdating}
      />
    </div>
  );
};
