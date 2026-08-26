import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera } from '../../types';
import { apiClient } from '../../services/apiClient';
import { StatusIndicator } from '../Common/StatusIndicator';
import { CameraControls } from './CameraControls';
import {
  Video,
  Square,
  Camera as CameraIcon,
  Volume2,
  VolumeX,
  X,
  Compass,
  Activity,
  Layers,
  Sparkles,
  Download,
  Check
} from 'lucide-react';

interface CameraPlayerProps {
  camera: Camera;
  onClose: () => void;
  onStartRecording: (id: string) => Promise<any>;
  onStopRecording: (id: string) => Promise<any>;
  onTakeSnapshot: (id: string) => Promise<any>;
  onPtzControl: (id: string, action: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'preset_home' | 'stop') => Promise<any>;
}

export const CameraPlayer: React.FC<CameraPlayerProps> = ({
  camera,
  onClose,
  onStartRecording,
  onStopRecording,
  onTakeSnapshot,
  onPtzControl
}) => {
  const [streamProfile, setStreamProfile] = useState<'MAIN_2K' | 'SUB_360P'>('MAIN_2K');
  const [isMuted, setIsMuted] = useState(true);
  const [showPtzDrawer, setShowPtzDrawer] = useState(camera.panTiltSupported);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !camera.liveHlsUrl) return;
    setStreamError(null);

    const playlistUrl = camera.liveHlsUrl.startsWith('http')
      ? camera.liveHlsUrl
      : `${apiClient.getBaseUrl()}${camera.liveHlsUrl}`;
    const streamUrl = `${playlistUrl}?profile=${streamProfile === 'MAIN_2K' ? 'main' : 'sub'}`;
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
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
          return;
        }
        setStreamError('Live stream could not start. Check FFmpeg, RTSP credentials, and camera status.');
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      setStreamError('This browser does not support HLS playback.');
    }
    video.play().catch(() => undefined);
    return () => {
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [camera.liveHlsUrl, streamProfile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const keepNearLive = () => {
      if (video.duration && Number.isFinite(video.duration) && video.duration - video.currentTime > 3) {
        video.currentTime = Math.max(0, video.duration - 1);
      }
    };
    const liveEdgeTimer = window.setInterval(keepNearLive, 2000);
    video.addEventListener('waiting', keepNearLive);
    return () => {
      window.clearInterval(liveEdgeTimer);
      video.removeEventListener('waiting', keepNearLive);
    };
  }, []);

  const handleRecToggle = async () => {
    setActionLoading(true);
    try {
      if (camera.isRecording) {
        await onStopRecording(camera.id);
      } else {
        await onStartRecording(camera.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAudioToggle = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) video.play().catch(() => undefined);
    }
  };

  const handleSnapshot = async () => {
    try {
      await onTakeSnapshot(camera.id);
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const isOnline = camera.status === 'ONLINE';

  return (
    <div
      id="enlarged-camera-player-modal"
      className="fixed inset-0 z-50 bg-[#0A0C10]/95 backdrop-blur-md flex flex-col overflow-hidden text-gray-200"
    >
      {/* Top Bar */}
      <div className="h-16 px-6 border-b border-[#242933] bg-[#11141B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="close-player-btn"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#1A1E26] rounded-lg transition-colors cursor-pointer border border-[#242933]"
            title="Back to Grid"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{camera.name}</h2>
              <span className="text-xs font-mono text-gray-400">({camera.model})</span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>{camera.location}</span>
              <span>•</span>
              <span className="font-mono text-gray-400">IP: {camera.ipAddress}:{camera.port}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {camera.isRecording && (
            <StatusIndicator status="RECORDING" size="md" />
          )}
          <StatusIndicator status={camera.status} size="md" />
        </div>
      </div>

      {/* Main View Area with Video Player + PTZ Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Large Video Canvas Section */}
        <div className="flex-1 bg-[#0A0C10] flex flex-col relative justify-center items-center p-6">
          <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-[#242933] shadow-2xl bg-black aspect-video">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              autoPlay
              muted={isMuted}
              playsInline
              controls
            />
            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-6 text-center">
                <p className="max-w-sm text-xs text-red-200">{streamError}</p>
              </div>
            )}

            {/* Tapo TC40 OSD Live Stream HUD Overlays */}
            <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                <span className="bg-black/70 backdrop-blur-xs text-green-400 font-mono text-xs px-2.5 py-1 rounded border border-green-500/30">
                LIVE HLS // {streamProfile === 'MAIN_2K' ? 'STREAM 1 (2K)' : 'STREAM 2 (360P)'}
              </span>
            </div>

            {/* Snapshot Toast Indicator */}
            {snapshotSuccess && (
              <div className="absolute top-4 right-4 bg-green-950/90 border border-green-500/50 text-green-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-lg animate-in fade-in">
                <Check className="w-4 h-4 text-green-400" />
                Snapshot frame saved to desktop
              </div>
            )}
          </div>

          {/* Player Toolbar */}
          <div className="w-full max-w-5xl mt-4 px-5 py-3 bg-[#11141B] border border-[#242933] rounded-xl flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                id="player-stream-toggle"
                onClick={() => setStreamProfile(p => p === 'MAIN_2K' ? 'SUB_360P' : 'MAIN_2K')}
                className="px-3 py-1.5 bg-[#161921] hover:bg-[#1A1E26] text-gray-200 rounded-lg text-xs font-mono font-medium border border-[#242933] transition-colors cursor-pointer"
                title="Toggle RTSP Stream Profile"
              >
                {streamProfile === 'MAIN_2K' ? 'Profile: Main 2K (High Res)' : 'Profile: Sub 360p (Low Bandwidth)'}
              </button>

              <button
                id="player-audio-toggle"
                onClick={handleAudioToggle}
                className={`p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-[#161921] text-gray-400 border-[#242933] hover:text-white'
                    : 'bg-green-500/20 text-green-300 border-green-500/40'
                }`}
                title={isMuted ? 'Unmute Audio Stream' : 'Mute Audio Stream'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {camera.panTiltSupported && (
                <button
                  id="player-ptz-toggle"
                  onClick={() => setShowPtzDrawer(!showPtzDrawer)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showPtzDrawer
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                      : 'bg-[#161921] text-gray-300 border-[#242933] hover:bg-[#1A1E26]'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>PTZ Controls</span>
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <button
                id="player-snapshot-btn"
                onClick={handleSnapshot}
                disabled={!isOnline}
                className="px-3.5 py-1.5 bg-[#161921] hover:bg-[#1A1E26] text-gray-200 disabled:opacity-40 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-[#242933] transition-colors cursor-pointer"
              >
                <CameraIcon className="w-4 h-4 text-gray-400" />
                <span>Take Snapshot</span>
              </button>

              <button
                id="player-record-btn"
                onClick={handleRecToggle}
                disabled={!isOnline || actionLoading}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                  camera.isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/40'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-950/40'
                } disabled:opacity-40`}
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : camera.isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    <span>Start FFmpeg REC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* PTZ and Camera Info Side Panel */}
        {showPtzDrawer && (
          <div className="w-80 bg-[#11141B] border-l border-[#242933] p-5 overflow-y-auto space-y-6">
            <CameraControls camera={camera} onPtzControl={onPtzControl} />

            {/* Hardware Telemetry Card */}
            <div className="bg-[#161921] border border-[#242933] rounded-xl p-4 space-y-3 font-mono text-xs">
              <h5 className="text-gray-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                Stream Telemetry
              </h5>
              <div className="space-y-1.5 text-gray-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="text-white">{camera.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span>Framerate:</span>
                  <span className="text-white">{camera.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span>Bitrate:</span>
                  <span className="text-white">{camera.bitrateKbps} Kbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Latency:</span>
                  <span className="text-green-400 font-bold">~18 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>RTSP Path:</span>
                  <span className="text-white">{camera.rtspStreamPath}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firmware:</span>
                  <span className="text-gray-400 text-[10px] truncate max-w-[140px]">{camera.firmwareVersion || 'v1.2.4'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
