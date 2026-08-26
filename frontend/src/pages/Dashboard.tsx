import React from 'react';
import { Camera, Recording, StorageStatus, SystemHealth, SurveillanceEvent } from '../types';
import { StatusIndicator } from '../components/Common/StatusIndicator';
import {
  Video,
  Film,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Clock,
  ShieldCheck,
  Radio,
  Sliders,
  Play,
  Download,
  AlertTriangle
} from 'lucide-react';
import { ActivePage } from '../components/Layout/Sidebar';

interface DashboardProps {
  cameras: Camera[];
  recordings: Recording[];
  storage: StorageStatus;
  health: SystemHealth;
  events: SurveillanceEvent[];
  onNavigate: (page: ActivePage) => void;
  onSelectCamera: (camera: Camera) => void;
  onPlayRecording: (recording: Recording) => void;
  onDownloadRecording: (recording: Recording) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cameras,
  recordings,
  storage,
  health,
  events,
  onNavigate,
  onSelectCamera,
  onPlayRecording,
  onDownloadRecording
}) => {
  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => c.status === 'ONLINE').length;
  const offlineCameras = cameras.filter(c => c.status === 'OFFLINE' || c.status === 'ERROR').length;
  const recordingCount = cameras.filter(c => c.isRecording).length;

  const recentRecordings = recordings.slice(0, 5);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & System Quick Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Surveillance Operations Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              ALL SYSTEMS NORMAL
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Local Windows desktop VMS monitoring active Tapo TC40 RTSP streams, FFmpeg disk recorders, and local security motion alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dash-quick-live-btn"
            onClick={() => onNavigate('live')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Open Live Wall ({onlineCameras} Active)</span>
          </button>
          <button
            id="dash-quick-settings-btn"
            onClick={() => onNavigate('settings')}
            className="p-2 bg-[#1A1E26] hover:bg-[#242933] text-gray-300 rounded-lg border border-[#242933] transition-colors cursor-pointer"
            title="System Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Geometric Balance styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cameras Card */}
        <div
          onClick={() => onNavigate('cameras')}
          className="group bg-[#161921] border border-[#242933] hover:border-gray-700 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Total Cameras</p>
            <div className="p-1.5 bg-blue-500/10 rounded text-blue-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-white">
              {totalCameras < 10 ? `0${totalCameras}` : totalCameras}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-500 font-medium">{onlineCameras} Online</span>
              <span className="text-gray-600">•</span>
              <span className={offlineCameras > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}>
                {offlineCameras} Offline
              </span>
            </div>
          </div>
        </div>

        {/* Online Status Card */}
        <div
          onClick={() => onNavigate('live')}
          className="group bg-[#161921] border border-[#242933] hover:border-gray-700 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Online</p>
            <div className="p-1.5 bg-green-500/10 rounded text-green-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-green-500">
              {onlineCameras < 10 ? `0${onlineCameras}` : onlineCameras}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              RTSP stream active
            </p>
          </div>
        </div>

        {/* Recording Status Card */}
        <div
          onClick={() => onNavigate('live')}
          className={`group bg-[#161921] border p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
            recordingCount > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-[#242933]'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Recording</p>
            <div className={`p-1.5 rounded ${recordingCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-[#1A1E26] text-gray-400'}`}>
              <Radio className={`w-4 h-4 ${recordingCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-red-500 flex items-center gap-2">
              <span>{recordingCount < 10 ? `0${recordingCount}` : recordingCount}</span>
              {recordingCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">
                  ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {recordingCount > 0 ? 'Writing to storage' : 'All feeds idle'}
            </p>
          </div>
        </div>

        {/* Offline Status Card */}
        <div
          onClick={() => onNavigate('cameras')}
          className="group bg-[#161921] border border-[#242933] hover:border-gray-700 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Offline</p>
            <div className="p-1.5 bg-[#1A1E26] rounded text-gray-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold font-mono text-gray-500">
              {offlineCameras < 10 ? `0${offlineCameras}` : offlineCameras}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {storage.availableSpaceGB.toFixed(0)} GB Free on drive
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Camera Status Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Status Overview Grid (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Camera Status Overview
              </h2>
            </div>
            <button
              onClick={() => onNavigate('cameras')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Cameras</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                onClick={() => {
                  onSelectCamera(camera);
                  onNavigate('live');
                }}
                className="bg-[#161921] border border-[#242933] hover:border-gray-700 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#1A1E26] group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                      {camera.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{camera.location}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {camera.isRecording && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <StatusIndicator status={camera.status} size="sm" showLabel={true} />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#242933] flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="truncate">{camera.ipAddress}</span>
                  <span className="text-gray-300 font-medium">{camera.resolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Surveillance Audit Log & Events (Right 1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Security Audit Log
              </h2>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Live Feed</span>
          </div>

          <div className="bg-[#11141B] border border-[#242933] rounded-2xl p-4 space-y-3">
            {events.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No recent security events</p>
            ) : (
              events.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-[#161921] border border-[#242933] rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200 truncate max-w-[150px]">
                      {evt.cameraName}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {evt.timestamp.slice(11, 19)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{evt.message}</p>
                </div>
              ))
            )}
            <button
              onClick={() => onNavigate('recordings')}
              className="w-full py-2 border border-[#242933] rounded text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:bg-[#1A1E26] hover:text-white transition-colors cursor-pointer"
            >
              View System Logs
            </button>
          </div>
        </div>
      </div>

      {/* Recent Recordings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Recent Video Recordings
            </h2>
          </div>
          <button
            onClick={() => onNavigate('recordings')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Recordings ({storage.totalRecordingsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#11141B] border border-[#242933] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#161921] border-b border-[#242933] text-gray-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Camera</th>
                  <th className="py-3.5 px-5">Start Time</th>
                  <th className="py-3.5 px-5">Duration</th>
                  <th className="py-3.5 px-5">File Size</th>
                  <th className="py-3.5 px-5">Trigger</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242933]">
                {recentRecordings.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#1A1E26]/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-gray-200">{rec.cameraName}</div>
                      <div className="text-[10px] text-gray-500">{rec.cameraLocation}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-300">
                      {rec.startTime.slice(0, 10)} {rec.startTime.slice(11, 16)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-300">
                      {Math.floor(rec.durationSeconds / 60)}m {rec.durationSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-300">
                      {rec.fileSizeMB.toFixed(1)} MB
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1A1E26] text-gray-300 border border-[#242933]">
                        {rec.triggerType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`dash-play-rec-${rec.id}`}
                          onClick={() => onPlayRecording(rec)}
                          className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-colors border border-blue-600/20 flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => onDownloadRecording(rec)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-[#1A1E26] rounded transition-colors border border-[#242933] cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
