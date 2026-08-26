import React, { useState } from 'react';
import { Camera, Recording, RecordingFilterParams } from '../types';
import { RecordingFilters } from '../components/Recording/RecordingFilters';
import { RecordingTable } from '../components/Recording/RecordingTable';
import { RecordingCard } from '../components/Recording/RecordingCard';
import { RecordingPlayerModal } from '../components/Recording/RecordingPlayerModal';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import {
  Film,
  Table,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  DownloadCloud,
  FileVideo
} from 'lucide-react';

interface RecordingsProps {
  recordings: Recording[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: RecordingFilterParams;
  loading: boolean;
  deletingId?: string | null;
  cameras: Camera[];
  onUpdateFilters: (filters: Partial<RecordingFilterParams>) => void;
  onResetFilters: () => void;
  onDeleteRecording: (id: string) => Promise<any>;
  onDownloadRecording: (recording: Recording) => Promise<any>;
  activePlayingRecording: Recording | null;
  onPlayRecording: (recording: Recording | null) => void;
}

export const Recordings: React.FC<RecordingsProps> = ({
  recordings,
  totalCount,
  page,
  pageSize,
  totalPages,
  filters,
  loading,
  deletingId,
  cameras,
  onUpdateFilters,
  onResetFilters,
  onDeleteRecording,
  onDownloadRecording,
  activePlayingRecording,
  onPlayRecording
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSort = (sortBy: 'startTime' | 'duration' | 'fileSize' | 'cameraName') => {
    const isCurrent = filters.sortBy === sortBy;
    const nextDir = isCurrent && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    onUpdateFilters({ sortBy, sortDirection: nextDir });
  };

  const handleConfirmDelete = async () => {
    if (!recordingToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteRecording(recordingToDelete.id);
      setRecordingToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-gray-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Video Recording Vault
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {totalCount} Archived Files
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Search, preview timeline playback, download MP4 clips, and manage local desktop retention.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0A0C10] p-1 rounded-lg border border-[#242933]">
            <button
              id="view-table-btn"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1A1E26] text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              id="view-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#1A1E26] text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls (Date, Time, Camera, Trigger, Search) */}
      <RecordingFilters
        filters={filters}
        cameras={cameras}
        onFilterChange={onUpdateFilters}
        onReset={onResetFilters}
      />

      {/* Main Recordings Content: Table or Card Grid */}
      {viewMode === 'table' ? (
        <RecordingTable
          recordings={recordings}
          loading={loading}
          onPlay={(rec) => onPlayRecording(rec)}
          onDownload={(rec) => onDownloadRecording(rec)}
          onDelete={(rec) => setRecordingToDelete(rec)}
          deletingId={deletingId}
          filters={filters}
          onSort={handleSort}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recordings.map((rec) => (
            <RecordingCard
              key={rec.id}
              recording={rec}
              onPlay={(r) => onPlayRecording(r)}
              onDownload={(r) => onDownloadRecording(r)}
              onDelete={(r) => setRecordingToDelete(r)}
              isDeleting={deletingId === rec.id}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-[#11141B] border border-[#242933] rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="text-xs text-gray-400 font-mono">
          Showing <span className="text-white font-semibold">{recordings.length}</span> of{' '}
          <span className="text-white font-semibold">{totalCount}</span> recordings
        </div>

        <div className="flex items-center gap-2">
          <button
            id="pagination-prev-btn"
            onClick={() => onUpdateFilters({ page: Math.max(1, page - 1) })}
            disabled={page <= 1 || loading}
            className="p-1.5 bg-[#161921] hover:bg-[#1A1E26] disabled:opacity-30 rounded-lg text-gray-300 border border-[#242933] transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-gray-300 px-2">
            Page {page} of {totalPages || 1}
          </span>

          <button
            id="pagination-next-btn"
            onClick={() => onUpdateFilters({ page: Math.min(totalPages, page + 1) })}
            disabled={page >= totalPages || loading}
            className="p-1.5 bg-[#161921] hover:bg-[#1A1E26] disabled:opacity-30 rounded-lg text-gray-300 border border-[#242933] transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dedicated Video Playback Interface Modal */}
      {activePlayingRecording && (
        <RecordingPlayerModal
          recording={activePlayingRecording}
          isOpen={Boolean(activePlayingRecording)}
          onClose={() => onPlayRecording(null)}
          onDownload={(rec) => onDownloadRecording(rec)}
        />
      )}

      {/* Safe Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(recordingToDelete)}
        onClose={() => setRecordingToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Video Recording?"
        message={
          <div className="space-y-2">
            <p>
              Are you sure you want to permanently delete this recording for{' '}
              <strong className="text-white">{recordingToDelete?.cameraName}</strong>?
            </p>
            <div className="p-2.5 bg-[#0A0C10] rounded border border-[#242933] font-mono text-xs text-gray-400 space-y-1">
              <div>Time: {recordingToDelete?.startTime}</div>
              <div>File: {recordingToDelete?.storageFilePath}</div>
              <div>Size: {recordingToDelete?.fileSizeMB.toFixed(1)} MB</div>
            </div>
            <p className="text-red-400 text-xs font-medium">
              This action cannot be undone and will free space on your local desktop disk.
            </p>
          </div>
        }
        confirmText="Delete File"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
