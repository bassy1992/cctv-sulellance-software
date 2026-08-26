import React from 'react';
import { Recording, RecordingFilterParams } from '../../types';
import { TableRowSkeleton } from '../Common/SkeletonLoader';
import { StatusIndicator } from '../Common/StatusIndicator';
import {
  Play,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Video,
  ArrowUpDown,
  FileVideo,
  Activity
} from 'lucide-react';

interface RecordingTableProps {
  recordings: Recording[];
  loading?: boolean;
  onPlay: (recording: Recording) => void;
  onDownload: (recording: Recording) => void;
  onDelete: (recording: Recording) => void;
  deletingId?: string | null;
  filters: RecordingFilterParams;
  onSort: (sortBy: 'startTime' | 'duration' | 'fileSize' | 'cameraName') => void;
}

export const RecordingTable: React.FC<RecordingTableProps> = ({
  recordings,
  loading = false,
  onPlay,
  onDownload,
  onDelete,
  deletingId,
  filters,
  onSort
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatFileSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getTriggerBadge = (trigger: Recording['triggerType']) => {
    switch (trigger) {
      case 'MOTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            MOTION
          </span>
        );
      case 'CONTINUOUS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            24/7 REC
          </span>
        );
      case 'MANUAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            MANUAL
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            SCHEDULE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#11141B] border border-[#242933] rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#161921] border-b border-[#242933] text-gray-400 font-mono text-[11px] uppercase tracking-wider">
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('cameraName')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Camera</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-500" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('startTime')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Start Time</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">End Time</th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('duration')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Duration</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-500" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => onSort('fileSize')}
              >
                <div className="flex items-center gap-1.5">
                  <span>File Size</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">Event Type</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242933]/60">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
            ) : recordings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <FileVideo className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium text-gray-400">No recordings match search filters</p>
                  <p className="text-[11px] mt-0.5 text-gray-500">Try adjusting date, time, or camera filter.</p>
                </td>
              </tr>
            ) : (
              recordings.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-[#161921]/60 transition-colors group"
                >
                  {/* Camera */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{rec.cameraName}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[160px]">
                      {rec.cameraLocation}
                    </div>
                  </td>

                  {/* Start Time */}
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    <div>{rec.startTime.slice(0, 10)}</div>
                    <div className="text-gray-400 text-[11px]">{rec.startTime.slice(11, 19)}</div>
                  </td>

                  {/* End Time */}
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    <div>{rec.endTime.slice(0, 10)}</div>
                    <div className="text-gray-400 text-[11px]">{rec.endTime.slice(11, 19)}</div>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{formatDuration(rec.durationSeconds)}</span>
                    </div>
                  </td>

                  {/* File Size */}
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-gray-500" />
                      <span>{formatFileSize(rec.fileSizeMB)}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">{rec.resolution}</div>
                  </td>

                  {/* Trigger Type */}
                  <td className="py-3.5 px-4">{getTriggerBadge(rec.triggerType)}</td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusIndicator status={rec.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`play-recording-${rec.id}`}
                        onClick={() => onPlay(rec)}
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors border border-blue-500/30 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        title="Play in Video Player"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </button>

                      <button
                        id={`download-recording-${rec.id}`}
                        onClick={() => onDownload(rec)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
                        title="Download to Local Desktop"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`delete-recording-${rec.id}`}
                        onClick={() => onDelete(rec)}
                        disabled={deletingId === rec.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-[#242933] hover:border-red-500/30 disabled:opacity-40 cursor-pointer"
                        title="Delete from Hard Drive"
                      >
                        {deletingId === rec.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
