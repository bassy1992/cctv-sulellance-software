import React from 'react';
import { Recording } from '../../types';
import { StatusIndicator } from '../Common/StatusIndicator';
import {
  Play,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Video,
  FileVideo
} from 'lucide-react';

interface RecordingCardProps {
  recording: Recording;
  onPlay: (recording: Recording) => void;
  onDownload: (recording: Recording) => void;
  onDelete: (recording: Recording) => void;
  isDeleting?: boolean;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  onPlay,
  onDownload,
  onDelete,
  isDeleting = false
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      id={`recording-card-${recording.id}`}
      className="group bg-[#11141B] border border-[#242933] hover:border-gray-700 rounded-xl overflow-hidden shadow-xs flex flex-col transition-all text-gray-200"
    >
      {/* Thumbnail Preview Area */}
      <div
        className="relative aspect-video bg-[#0A0C10] flex items-center justify-center cursor-pointer group-hover:brightness-105 transition"
        onClick={() => onPlay(recording)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-[#0A0C10]/40 to-transparent z-10" />

        <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform z-20">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>

        <div className="absolute top-2 left-2 z-20">
          <span className="bg-black/70 text-gray-200 text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-white/10">
            {recording.resolution}
          </span>
        </div>

        <div className="absolute top-2 right-2 z-20">
          <StatusIndicator status={recording.status} size="sm" />
        </div>

        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between text-[11px] font-mono text-gray-300">
          <span>{recording.startTime.slice(0, 10)} {recording.startTime.slice(11, 16)}</span>
          <span className="bg-black/60 px-1.5 py-0.5 rounded">{formatDuration(recording.durationSeconds)}</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{recording.cameraName}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{recording.cameraLocation}</p>
        </div>

        <div className="pt-2.5 border-t border-[#242933] flex items-center justify-between">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-gray-500" />
            <span>{recording.fileSizeMB.toFixed(1)} MB</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDownload(recording)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(recording)}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-[#242933] hover:border-red-500/30 disabled:opacity-40 cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
