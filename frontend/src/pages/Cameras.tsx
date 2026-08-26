import React, { useState } from 'react';
import { Camera, CameraFormData, ConnectionTestResult } from '../types';
import { StatusIndicator } from '../components/Common/StatusIndicator';
import { CameraFormModal } from '../components/Camera/CameraFormModal';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import {
  Camera as CameraIcon,
  Plus,
  Edit2,
  Trash2,
  Power,
  Network,
  Video,
  Shield,
  RefreshCw,
  HardDrive,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CamerasProps {
  cameras: Camera[];
  loading: boolean;
  onAddCamera: (data: CameraFormData) => Promise<any>;
  onUpdateCamera: (id: string, data: Partial<CameraFormData & { isEnabled: boolean; recordingEnabled: boolean }>) => Promise<any>;
  onDeleteCamera: (id: string) => Promise<any>;
  onTestConnection: (data: Partial<CameraFormData>) => Promise<ConnectionTestResult>;
  onRefresh: () => void;
}

export const Cameras: React.FC<CamerasProps> = ({
  cameras,
  loading,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
  onTestConnection,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ [id: string]: ConnectionTestResult }>({});

  const handleOpenAdd = () => {
    setEditingCamera(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cam: Camera) => {
    setEditingCamera(cam);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CameraFormData) => {
    if (editingCamera) {
      await onUpdateCamera(editingCamera.id, data);
    } else {
      await onAddCamera(data);
    }
  };

  const handleToggleEnabled = async (cam: Camera) => {
    await onUpdateCamera(cam.id, { isEnabled: !cam.isEnabled });
  };

  const handleToggleRecordingEnabled = async (cam: Camera) => {
    await onUpdateCamera(cam.id, { recordingEnabled: !cam.recordingEnabled });
  };

  const handleInlineTest = async (cam: Camera) => {
    setTestingId(cam.id);
    try {
      const res = await onTestConnection({
        ipAddress: cam.ipAddress,
        port: cam.port,
        onvifPort: cam.onvifPort,
        username: cam.username,
        password: '',
        rtspStreamPath: cam.rtspStreamPath
      });
      setTestFeedback(prev => ({ ...prev, [cam.id]: res }));
      setTimeout(() => {
        setTestFeedback(prev => {
          const clone = { ...prev };
          delete clone[cam.id];
          return clone;
        });
      }, 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] border border-[#242933] rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">
              Camera Management & RTSP Registry
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {cameras.length} Registered Devices
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure Tapo TC40 IP addresses, stream profiles, ONVIF ports, credentials, and test connectivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-xl border border-[#242933] transition-colors cursor-pointer"
            title="Refresh Camera Statuses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="add-camera-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tapo TC40 Camera</span>
          </button>
        </div>
      </div>

      {/* Camera Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <div
            key={camera.id}
            id={`camera-mgmt-card-${camera.id}`}
            className="bg-[#11141B] border border-[#242933] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-gray-700 transition-all shadow-xs text-gray-200"
          >
            {/* Header: Name + Status */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{camera.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{camera.location}</p>
                </div>
                <StatusIndicator status={camera.status} size="sm" />
              </div>

              {/* Specs & Protocol Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-[#161921] text-gray-300 text-[10px] font-mono rounded border border-[#242933]">
                  {camera.model}
                </span>
                <span className="px-2 py-0.5 bg-[#161921] text-gray-300 text-[10px] font-mono rounded border border-[#242933]">
                  {camera.resolution}
                </span>
                {camera.panTiltSupported && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-[10px] font-mono rounded border border-blue-500/20 flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span>PTZ Motor</span>
                  </span>
                )}
              </div>
            </div>

            {/* Technical Detail Grid */}
            <div className="p-3 bg-[#161921] rounded-lg border border-[#242933] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>IP Address:</span>
                <span className="text-gray-200 font-semibold">{camera.ipAddress}:{camera.port}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>RTSP Stream:</span>
                <span className="text-gray-200">{camera.rtspStreamPath}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Username:</span>
                <span className="text-gray-200">{camera.username}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Password:</span>
                <span className="text-gray-500">•••••••• (Protected)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Disk Recording:</span>
                <span className={camera.recordingEnabled ? 'text-green-400 font-bold' : 'text-gray-500'}>
                  {camera.recordingEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            {/* Test connection output if triggered */}
            {testFeedback[camera.id] && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-mono ${
                  testFeedback[camera.id].success
                    ? 'bg-green-950/40 border-green-500/40 text-green-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testFeedback[camera.id].success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span>{testFeedback[camera.id].success ? 'Handshake Successful' : 'Test Failed'}</span>
                </div>
                <p className="text-[10px] mt-0.5 text-gray-300">
                  {testFeedback[camera.id].message}
                </p>
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="pt-2 border-t border-[#242933] flex items-center justify-between gap-2">
              <button
                id={`test-connection-cam-${camera.id}`}
                onClick={() => handleInlineTest(camera)}
                disabled={testingId === camera.id}
                className="px-2.5 py-1.5 bg-[#161921] hover:bg-[#1A1E26] text-gray-200 text-xs font-medium rounded-lg border border-[#242933] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${testingId === camera.id ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
                <span>{testingId === camera.id ? 'Pinging...' : 'Test'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {/* Enable/Disable Toggle */}
                <button
                  id={`toggle-enable-cam-${camera.id}`}
                  onClick={() => handleToggleEnabled(camera)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    camera.isEnabled
                      ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                      : 'bg-[#161921] text-gray-500 border-[#242933] hover:text-gray-300'
                  }`}
                  title={camera.isEnabled ? 'Disable Camera Stream' : 'Enable Camera Stream'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* Edit Button */}
                <button
                  id={`edit-cam-${camera.id}`}
                  onClick={() => handleOpenEdit(camera)}
                  className="p-1.5 text-gray-300 hover:text-white bg-[#161921] hover:bg-[#1A1E26] rounded-lg border border-[#242933] transition-colors cursor-pointer"
                  title="Edit Camera Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  id={`delete-cam-${camera.id}`}
                  onClick={() => setDeletingCamera(camera)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-[#242933] hover:border-red-500/30 transition-colors cursor-pointer"
                  title="Remove Camera"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Camera Modal */}
      <CameraFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        onTestConnection={onTestConnection}
        initialCamera={editingCamera}
      />

      {/* Confirm Camera Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCamera)}
        onClose={() => setDeletingCamera(null)}
        onConfirm={async () => {
          if (deletingCamera) {
            await onDeleteCamera(deletingCamera.id);
            setDeletingCamera(null);
          }
        }}
        title="Remove Camera from Surveillance?"
        message={
          <p>
            Are you sure you want to remove <strong className="text-white">{deletingCamera?.name}</strong>?
            Active RTSP stream listeners will be detached. Existing recorded files on your desktop drive will not be deleted.
          </p>
        }
        confirmText="Remove Camera"
        isDangerous={true}
      />
    </div>
  );
};
