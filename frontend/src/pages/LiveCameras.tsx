import React, { useState } from 'react';
import { Camera } from '../types';
import { CameraGrid } from '../components/Camera/CameraGrid';
import { CameraPlayer } from '../components/Camera/CameraPlayer';
import {
  Grid,
  Maximize2,
  Video,
  Square,
  RefreshCw,
  LayoutGrid,
  Filter,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface LiveCamerasProps {
  cameras: Camera[];
  loading: boolean;
  onRefresh: () => void;
  onStartRecording: (id: string) => Promise<any>;
  onStopRecording: (id: string) => Promise<any>;
  onTakeSnapshot: (id: string) => Promise<any>;
  onPtzControl: (id: string, action: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'preset_home' | 'stop') => Promise<any>;
  actionLoadingId?: string | null;
  selectedCamera: Camera | null;
  onSelectCamera: (camera: Camera | null) => void;
}

export const LiveCameras: React.FC<LiveCamerasProps> = ({
  cameras,
  loading,
  onRefresh,
  onStartRecording,
  onStopRecording,
  onTakeSnapshot,
  onPtzControl,
  actionLoadingId,
  selectedCamera,
  onSelectCamera
}) => {
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x2' | '3x3'>('3x2');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'RECORDING'>('ALL');
  const [isBulkRecording, setIsBulkRecording] = useState(false);

  const filteredCameras = cameras.filter((cam) => {
    if (statusFilter === 'ONLINE') return cam.status === 'ONLINE';
    if (statusFilter === 'RECORDING') return cam.isRecording;
    return true;
  });

  const onlineCameras = cameras.filter(c => c.status === 'ONLINE');
  const allRecording = onlineCameras.length > 0 && onlineCameras.every(c => c.isRecording);

  const handleToggleAllRecording = async () => {
    setIsBulkRecording(true);
    try {
      if (allRecording) {
        for (const cam of onlineCameras) {
          if (cam.isRecording) await onStopRecording(cam.id);
        }
      } else {
        for (const cam of onlineCameras) {
          if (!cam.isRecording) await onStartRecording(cam.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkRecording(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">
              Live Surveillance Matrix
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
              {onlineCameras.length} Live Feeds
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time Tapo TC40 RTSP streaming with PTZ motor navigation and instant disk recording.
          </p>
        </div>

        {/* Layout & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-[#161921] p-1 rounded-lg border border-[#242933] text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-[#1A1E26] text-white font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({cameras.length})
            </button>
            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'ONLINE' ? 'bg-green-500/20 text-green-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Online ({onlineCameras.length})
            </button>
            <button
              onClick={() => setStatusFilter('RECORDING')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === 'RECORDING' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Recording ({cameras.filter(c => c.isRecording).length})
            </button>
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center gap-1 bg-[#161921] p-1 rounded-lg border border-[#242933] text-xs font-mono">
            {(['1x1', '2x2', '3x2', '3x3'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  layout === l ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
                title={`Switch to ${l} Grid View`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Bulk Start/Stop All Recording */}
          <button
            id="bulk-record-btn"
            onClick={handleToggleAllRecording}
            disabled={isBulkRecording || onlineCameras.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-xs cursor-pointer ${
              allRecording
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                : 'bg-[#1A1E26] hover:bg-[#242933] text-gray-200 border-[#242933]'
            } disabled:opacity-50`}
          >
            {isBulkRecording ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : allRecording ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Video className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>{allRecording ? 'Stop All REC' : 'Record All'}</span>
          </button>

          {/* Refresh Streams */}
          <button
            id="refresh-live-feeds-btn"
            onClick={onRefresh}
            className="p-2 text-gray-300 hover:text-white bg-[#1A1E26] hover:bg-[#242933] rounded-lg border border-[#242933] transition-colors cursor-pointer"
            title="Refresh RTSP Streams"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Multi-Camera Video Grid */}
      <CameraGrid
        cameras={filteredCameras}
        layout={layout}
        loading={loading}
        selectedCameraId={selectedCamera?.id}
        actionLoadingId={actionLoadingId}
        onSelectCamera={(cam) => onSelectCamera(cam)}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onTakeSnapshot={onTakeSnapshot}
        onTogglePtz={(cam) => onSelectCamera(cam)}
      />

      {/* Enlarged Single Camera Video Player Modal with PTZ */}
      {selectedCamera && (
        <CameraPlayer
          camera={selectedCamera}
          onClose={() => onSelectCamera(null)}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onTakeSnapshot={onTakeSnapshot}
          onPtzControl={onPtzControl}
        />
      )}
    </div>
  );
};
