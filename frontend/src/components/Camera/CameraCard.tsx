import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera } from '../../types';
import { apiClient } from '../../services/apiClient';
import { StatusIndicator } from '../Common/StatusIndicator';
import {
  Video,
  Square,
  Camera as CameraIcon,
  Maximize2,
  Volume2,
  VolumeX,
  Compass,
  AlertCircle,
  HardDrive
} from 'lucide-react';

interface CameraCardProps {
  camera: Camera;
  onSelect?: (camera: Camera) => void;
  onStartRecording: (id: string) => Promise<any>;
  onStopRecording: (id: string) => Promise<any>;
  onTakeSnapshot: (id: string) => Promise<any>;
  onTogglePtz?: (camera: Camera) => void;
  isActionLoading?: boolean;
  isSelected?: boolean;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  onSelect,
  onStartRecording,
  onStopRecording,
  onTakeSnapshot,
  onTogglePtz,
  isActionLoading = false,
  isSelected = false
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [snapshotEffect, setSnapshotEffect] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !camera.liveHlsUrl || camera.status !== 'ONLINE') return;

    const playlistUrl = camera.liveHlsUrl.startsWith('http')
      ? camera.liveHlsUrl
      : `${apiClient.getBaseUrl()}${camera.liveHlsUrl}`;
    const streamUrl = `${playlistUrl}?profile=main`;
    let hls: Hls | null = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        maxLiveSyncPlaybackRate: 1.5,
        maxBufferLength: 6,
        backBufferLength: 0
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    }

    video.play().catch(() => undefined);
    return () => {
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [camera.liveHlsUrl, camera.status]);

  const handleRecordingToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);
    try {
      if (camera.isRecording) {
        await onStopRecording(camera.id);
      } else {
        await onStartRecording(camera.id);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Recording action failed');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleSnapshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSnapshotEffect(true);
      await onTakeSnapshot(camera.id);
      setTimeout(() => setSnapshotEffect(false), 300);
    } catch (err: any) {
      setErrorMessage('Snapshot capture failed');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const isOnline = camera.status === 'ONLINE';

  return (
    <div
      id={`camera-card-${camera.id}`}
      className={`group relative bg-[#161921] border rounded-xl overflow-hidden transition-all flex flex-col ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
          : 'border-[#242933] hover:border-gray-700 hover:shadow-lg'
      }`}
    >
      {/* Card Header */}
      <div className="px-3.5 py-2.5 bg-[#11141B] border-b border-[#242933] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
            {camera.name}
          </h4>
          <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
            {camera.ipAddress}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {camera.isRecording && (
            <StatusIndicator status="RECORDING" size="sm" showLabel={true} />
          )}
          <StatusIndicator status={camera.status} size="sm" showLabel={!camera.isRecording} />
        </div>
      </div>

      {/* Live Video Canvas Area */}
      <div
        className="relative cursor-pointer group-hover:brightness-[1.02] transition"
        onClick={() => onSelect && onSelect(camera)}
      >
        {isOnline && camera.liveHlsUrl ? (
          <video
            ref={videoRef}
            className="block w-full aspect-video object-cover bg-black"
            autoPlay
            muted
            playsInline
            preload="none"
          />
        ) : (
          <div className="aspect-video bg-[#090D16] flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {/* Camera snapshot flash effect */}
        {snapshotEffect && (
          <div className="absolute inset-0 bg-white/70 animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* Resolution Badge */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-xs text-gray-300 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-white/10">
            {camera.resolution.includes('2K') ? '2K 3MP' : '1080P'}
          </span>
        </div>

        {/* Quick Hover Controls Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded-lg border border-white/10">
          <button
            id={`camera-mute-${camera.id}`}
            onClick={handleMuteToggle}
            className="p-1 text-gray-300 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-green-400" />}
          </button>

          {camera.panTiltSupported && onTogglePtz && (
            <button
              id={`camera-ptz-${camera.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePtz(camera);
              }}
              className="p-1 text-gray-300 hover:text-blue-400 hover:bg-white/20 rounded transition-colors cursor-pointer"
              title="Pan/Tilt Controls"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id={`camera-fullscreen-${camera.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(camera);
            }}
            className="p-1 text-gray-300 hover:text-white hover:bg-white/20 rounded transition-colors cursor-pointer"
            title="Enlarge Video View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-950/90 border border-red-500/50 rounded p-1.5 text-[11px] text-red-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="px-3 py-2 bg-[#11141B] border-t border-[#242933] flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
          <HardDrive className="w-3.5 h-3.5 text-gray-500" />
          <span className="truncate max-w-[120px]">{camera.location}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`camera-snapshot-${camera.id}`}
            type="button"
            onClick={handleSnapshot}
            disabled={!isOnline}
            className="p-1.5 text-gray-300 hover:text-white bg-[#1A1E26] hover:bg-[#242933] disabled:opacity-40 disabled:hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
            title="Capture Instant Frame"
          >
            <CameraIcon className="w-3.5 h-3.5" />
          </button>

          <button
            id={`camera-record-btn-${camera.id}`}
            type="button"
            onClick={handleRecordingToggle}
            disabled={!isOnline || isActionLoading}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
              camera.isRecording
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-xs'
            } disabled:opacity-40`}
          >
            {isActionLoading ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : camera.isRecording ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop REC</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Record</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
