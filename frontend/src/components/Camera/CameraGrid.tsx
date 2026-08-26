import React from 'react';
import { Camera } from '../../types';
import { CameraCard } from './CameraCard';
import { CameraCardSkeleton } from '../Common/SkeletonLoader';

interface CameraGridProps {
  cameras: Camera[];
  layout: '1x1' | '2x2' | '3x2' | '3x3';
  loading?: boolean;
  selectedCameraId?: string | null;
  actionLoadingId?: string | null;
  onSelectCamera: (camera: Camera) => void;
  onStartRecording: (id: string) => Promise<any>;
  onStopRecording: (id: string) => Promise<any>;
  onTakeSnapshot: (id: string) => Promise<any>;
  onTogglePtz?: (camera: Camera) => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  layout,
  loading = false,
  selectedCameraId,
  actionLoadingId,
  onSelectCamera,
  onStartRecording,
  onStopRecording,
  onTakeSnapshot,
  onTogglePtz
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CameraCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-sm font-semibold text-slate-300">No cameras configured</p>
        <p className="text-xs text-slate-500 mt-1">
          Add your first Tapo TC40 security camera to start live surveillance.
        </p>
      </div>
    );
  }

  const gridClass = {
    '1x1': 'grid-cols-1 max-w-4xl mx-auto',
    '2x2': 'grid-cols-1 md:grid-cols-2',
    '3x2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '3x3': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3'
  }[layout];

  return (
    <div
      id="surveillance-camera-grid"
      className={`grid gap-4 ${gridClass}`}
    >
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          isSelected={selectedCameraId === camera.id}
          isActionLoading={actionLoadingId === camera.id}
          onSelect={onSelectCamera}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onTakeSnapshot={onTakeSnapshot}
          onTogglePtz={onTogglePtz}
        />
      ))}
    </div>
  );
};
