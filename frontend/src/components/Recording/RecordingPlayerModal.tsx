import React, { useRef, useState, useEffect } from 'react';
import { Recording } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Download,
  ArrowLeft,
  X,
  Clock,
  Calendar,
  HardDrive,
  Video,
  FileCode,
  Sparkles
} from 'lucide-react';

interface RecordingPlayerModalProps {
  recording: Recording | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (recording: Recording) => void;
}

export const RecordingPlayerModal: React.FC<RecordingPlayerModalProps> = ({
  recording,
  isOpen,
  onClose,
  onDownload
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoUrl = recording
    ? recording.videoUrl.startsWith('http')
      ? recording.videoUrl
      : recording.videoUrl.startsWith('/api/')
        ? `${apiClient.getBaseUrl().replace(/\/api\/?$/, '')}${recording.videoUrl}`
        : `${apiClient.getBaseUrl()}${recording.videoUrl}`
    : '';

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    setVideoError(false);
  }, [isOpen, recording]);

  if (!isOpen || !recording) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || recording.durationSeconds);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const skipSeconds = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('recording-player-box');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="recording-player-modal"
      className="fixed inset-0 z-50 bg-[#0A0C10]/95 backdrop-blur-md flex flex-col overflow-hidden text-gray-200"
    >
      {/* Top Header */}
      <div className="h-16 px-6 border-b border-[#242933] bg-[#11141B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            id="back-to-recordings-btn"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161921] hover:bg-[#1A1E26] text-gray-200 rounded-lg text-xs font-semibold transition-colors border border-[#242933] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recordings</span>
          </button>

          <div className="h-6 w-px bg-[#242933]" />

          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              {recording.cameraName} - Playback Session
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Recorded on {recording.startTime.slice(0, 10)} from {recording.startTime.slice(11, 19)} to {recording.endTime.slice(11, 19)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="modal-download-recording-btn"
            onClick={() => onDownload(recording)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clip ({recording.fileSizeMB.toFixed(1)} MB)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A1E26] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Video Area */}
        <div className="flex-1 bg-[#0A0C10] flex flex-col justify-center items-center p-4 lg:p-6 overflow-hidden">
          <div
            id="recording-player-box"
            className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-[#242933] flex items-center justify-center group"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => setVideoError(true)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              autoPlay
            />

            {/* Video Error fallback message */}
            {videoError && (
              <div className="absolute inset-0 bg-[#0A0C10]/90 flex flex-col items-center justify-center p-6 text-center">
                <FileCode className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-gray-200">Local Video Stream Ready</p>
                <p className="text-xs text-gray-400 max-w-md mt-1">
                  Target file path: <span className="font-mono text-gray-300">{recording.storageFilePath}</span>
                </p>
              </div>
            )}

            {/* Tapo TC40 OSD Watermark for Recording */}
            <div className="absolute top-4 left-4 pointer-events-none bg-black/60 backdrop-blur-xs px-3 py-1 rounded text-xs font-mono text-gray-300 border border-white/10 flex items-center gap-2">
              <span className="text-green-400">PLAYBACK</span>
              <span>•</span>
              <span>{recording.resolution}</span>
              <span>•</span>
              <span>{recording.fps} FPS</span>
            </div>

            {/* Hover Play/Pause Overlay indicator */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Timeline and Playback Controls Panel */}
          <div className="w-full max-w-5xl mt-4 bg-[#11141B] border border-[#242933] rounded-xl p-4 space-y-3 shadow-xs">
            {/* Scrubber Timeline */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span className="text-blue-400 font-semibold">{formatTime(currentTime)}</span>
                <span>{formatTime(duration || recording.durationSeconds)}</span>
              </div>
              <input
                id="playback-timeline-slider"
                type="range"
                min={0}
                max={duration || recording.durationSeconds}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#1A1E26] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Playback Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="skip-back-10s"
                  onClick={() => skipSeconds(-10)}
                  className="p-2 text-gray-300 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  id="play-pause-btn"
                  onClick={togglePlay}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2 text-xs shadow-xs cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  id="skip-fwd-10s"
                  onClick={() => skipSeconds(10)}
                  className="p-2 text-gray-300 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
                  title="Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 bg-[#1A1E26] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-[#0A0C10] p-1 rounded-lg border border-[#242933]">
                {[0.5, 1, 2, 4, 8].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => changeSpeed(spd)}
                    className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#161921]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-300 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-lg transition-colors border border-[#242933] cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Metadata Sidebar */}
        <div className="w-full lg:w-80 bg-[#11141B] border-t lg:border-t-0 lg:border-l border-[#242933] p-5 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Recording Metadata
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Desktop Hard Drive File Info</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#161921] rounded-xl border border-[#242933] space-y-2">
              <div className="flex justify-between items-center text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  Camera Name:
                </span>
                <span className="font-semibold text-white">{recording.cameraName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  Recorded Date:
                </span>
                <span className="font-mono text-gray-200">{recording.startTime.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  Duration:
                </span>
                <span className="font-mono text-gray-200">{Math.floor(recording.durationSeconds / 60)}m {recording.durationSeconds % 60}s</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                  File Size:
                </span>
                <span className="font-mono text-gray-200">{recording.fileSizeMB.toFixed(1)} MB</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#161921] rounded-xl border border-[#242933] space-y-1.5 text-[11px] font-mono">
              <span className="text-gray-400 font-bold block">Windows Storage Path:</span>
              <p className="text-gray-300 break-all bg-[#0A0C10] p-2.5 rounded-lg border border-[#242933]">
                {recording.storageFilePath}
              </p>
            </div>

            <div className="p-3.5 bg-[#161921] rounded-xl border border-[#242933] space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Codec / Container:</span>
                <span className="text-white font-mono">H.264 / MP4</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Native Resolution:</span>
                <span className="text-white font-mono">{recording.resolution}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Average Bitrate:</span>
                <span className="text-white font-mono">{recording.bitrateKbps} Kbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
