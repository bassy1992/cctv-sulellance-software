import React, { useState } from 'react';
import { Camera, SystemSettings } from '../types';
import {
  Settings as SettingsIcon,
  HardDrive,
  Video,
  Clock,
  Bell,
  Palette,
  Server,
  Cpu,
  Save,
  Check,
  RotateCcw,
  Shield,
  FolderOpen
} from 'lucide-react';

interface SettingsProps {
  settings: SystemSettings;
  cameras: Camera[];
  onSaveSettings: (settings: SystemSettings) => Promise<any>;
  onResetSettings: () => Promise<any>;
  isSaving?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  cameras,
  onSaveSettings,
  onResetSettings,
  isSaving = false
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSaveSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all surveillance parameters to system defaults?')) {
      await onResetSettings();
      setFormData(settings);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto text-gray-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">
              Surveillance System Settings
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Core VMS Config
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure local desktop recording engine, Django REST endpoint, disk targets, and Tapo TC40 defaults.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-[#161921] hover:bg-[#1A1E26] text-gray-300 rounded-lg text-xs font-medium border border-[#242933] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-950/50 border border-green-500/40 rounded-xl flex items-center gap-3 text-xs text-green-200 animate-in fade-in">
          <Check className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <span className="font-bold">Settings Saved Successfully!</span> System parameters applied to local desktop surveillance core.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General & Application Identity */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#242933] pb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">General Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Application Title
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Default Focus Camera
              </label>
              <select
                value={formData.defaultCameraId}
                onChange={(e) => setFormData({ ...formData, defaultCameraId: e.target.value })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#11141B] text-white">
                    {c.name} ({c.ipAddress})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                UI Interface Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="dark" className="bg-[#11141B] text-white">Geometric Balance Dark (Default)</option>
                <option value="light" className="bg-[#11141B] text-white">High-Contrast Light</option>
                <option value="system" className="bg-[#11141B] text-white">Follow OS System Theme</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Snapshot File Format
              </label>
              <select
                value={formData.snapshotFormat}
                onChange={(e) => setFormData({ ...formData, snapshotFormat: e.target.value as any })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="jpg" className="bg-[#11141B] text-white">JPEG (Standard Compressed)</option>
                <option value="png" className="bg-[#11141B] text-white">PNG (Lossless High Detail)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Recording Engine & FFmpeg Configurations */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#242933] pb-3">
            <Video className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-bold text-white">Recording & Capture Engine</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Default Manual Recording Limit (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={formData.defaultRecordingDurationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultRecordingDurationMinutes: Number(e.target.value) || 15
                  })
                }
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Continuous File Segment Splitting (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.recordingSegmentDurationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recordingSegmentDurationMinutes: Number(e.target.value) || 15
                  })
                }
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                FFmpeg Hardware Acceleration
              </label>
              <select
                value={formData.hardwareAcceleration}
                onChange={(e) =>
                  setFormData({ ...formData, hardwareAcceleration: e.target.value as any })
                }
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="none" className="bg-[#11141B] text-white">CPU Software Encoding (Universal)</option>
                <option value="cuda" className="bg-[#11141B] text-white">NVIDIA NVENC / CUDA (Recommended)</option>
                <option value="qsv" className="bg-[#11141B] text-white">Intel QuickSync Video (QSV)</option>
                <option value="d3d11va" className="bg-[#11141B] text-white">DirectX 11 Video Acceleration (D3D11VA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Storage Warning Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={98}
                value={formData.storageWarningThresholdPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    storageWarningThresholdPercent: Number(e.target.value) || 85
                  })
                }
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#242933]">
            <label className="flex items-center gap-2.5 cursor-pointer bg-[#0A0C10] p-3 rounded-lg border border-[#242933] hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={formData.automaticRecording}
                onChange={(e) =>
                  setFormData({ ...formData, automaticRecording: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-[#11141B] border-[#242933] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-200 block">Auto-Record on Start</span>
                <span className="text-[10px] text-gray-400">Launch feeds on boot</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer bg-[#0A0C10] p-3 rounded-lg border border-[#242933] hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={formData.motionRecording}
                onChange={(e) =>
                  setFormData({ ...formData, motionRecording: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-[#11141B] border-[#242933] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-200 block">Motion Trigger REC</span>
                <span className="text-[10px] text-gray-400">Record when movement seen</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer bg-[#0A0C10] p-3 rounded-lg border border-[#242933] hover:border-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={formData.enableNotifications}
                onChange={(e) =>
                  setFormData({ ...formData, enableNotifications: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 bg-[#11141B] border-[#242933] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-200 block">Desktop Notifications</span>
                <span className="text-[10px] text-gray-400">Security alarm toasts</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Storage & Directory Target */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#242933] pb-3">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Storage & Windows Drive Destination</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Windows Hard Drive Path
              </label>
              <input
                type="text"
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Auto-Retention Period (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={formData.retentionPeriodDays}
                onChange={(e) =>
                  setFormData({ ...formData, retentionPeriodDays: Number(e.target.value) || 30 })
                }
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Backend Django REST API Connection */}
        <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#242933] pb-3">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Django REST API Host Configuration</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Django REST API Endpoint URL
            </label>
            <input
              type="text"
              value={formData.djangoApiUrl}
              onChange={(e) => setFormData({ ...formData, djangoApiUrl: e.target.value })}
              className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Local endpoint for camera control, FFmpeg workers, and recording database. Default: <code className="bg-black/50 px-1 py-0.5 rounded font-mono border border-white/10 text-gray-300">http://127.0.0.1:8000/api</code>
            </p>
          </div>
        </div>

        {/* Form Submission Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Applying Changes...' : 'Save Surveillance Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
