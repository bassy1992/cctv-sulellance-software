import React, { useState, useEffect } from 'react';
import { Camera, CameraFormData, ConnectionTestResult } from '../../types';
import { Modal } from '../Common/Modal';
import {
  Video,
  Network,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

interface CameraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CameraFormData) => Promise<any>;
  onTestConnection: (data: Partial<CameraFormData>) => Promise<ConnectionTestResult>;
  initialCamera?: Camera | null;
  isLoading?: boolean;
}

/** Build the Tapo RTSP URL preview exactly as TP-Link specifies:
 *  rtsp://username:password@IP_ADDRESS/stream1  (port 554 is implicit — omitted)
 *  rtsp://username:password@IP_ADDRESS:PORT/stream1  (non-standard ports shown explicitly)
 */
function buildRtspPreview(data: CameraFormData): string {
  const { username, password, ipAddress, port, rtspStreamPath } = data;
  if (!ipAddress) return '';
  const auth = password ? `${username || 'admin'}:••••••••` : (username || 'admin');
  const portPart = port && port !== 554 ? `:${port}` : '';
  const path = rtspStreamPath || '/stream1';
  return `rtsp://${auth}@${ipAddress}${portPart}${path}`;
}

export const CameraFormModal: React.FC<CameraFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onTestConnection,
  initialCamera,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CameraFormData>({
    name: '',
    ipAddress: '',
    port: 554,
    onvifPort: 2020,
    username: 'admin',
    password: '',
    rtspStreamPath: '/stream1',
    subStreamPath: '/stream2',
    location: '',
    recordingEnabled: true,
    panTiltSupported: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCamera) {
      setFormData({
        name: initialCamera.name,
        ipAddress: initialCamera.ipAddress,
        port: initialCamera.port || 554,
        onvifPort: initialCamera.onvifPort || 2020,
        username: initialCamera.username || 'admin',
        password: '',
        rtspStreamPath: initialCamera.rtspStreamPath || '/stream1',
        subStreamPath: initialCamera.subStreamPath || '/stream2',
        location: initialCamera.location || '',
        recordingEnabled: initialCamera.recordingEnabled ?? true,
        panTiltSupported: initialCamera.panTiltSupported ?? true
      });
    } else {
      setFormData({
        name: '',
        ipAddress: '',
        port: 554,
        onvifPort: 2020,
        username: 'admin',
        password: '',
        rtspStreamPath: '/stream1',
        subStreamPath: '/stream2',
        location: '',
        recordingEnabled: true,
        panTiltSupported: true
      });
    }
    setTestResult(null);
    setFormError(null);
  }, [initialCamera, isOpen]);

  const handleTestConnection = async () => {
    if (!formData.ipAddress) {
      setFormError('Please enter an IP address before testing.');
      return;
    }
    setFormError(null);
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTestConnection(formData);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed to reach RTSP endpoint.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Camera name is required.');
      return;
    }
    if (!formData.ipAddress.trim()) {
      setFormError('Camera IP address is required.');
      return;
    }
    setFormError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save camera.');
    }
  };

  const rtspPreview = buildRtspPreview(formData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-500" />
          {initialCamera ? `Edit Camera: ${initialCamera.name}` : 'Add Tapo Camera'}
        </span>
      }
      subtitle="Connect a Tapo IP camera via RTSP (viewing) and ONVIF (PTZ control)."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-gray-200">

        {/* Camera Account Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/25 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-200 leading-relaxed">
            <span className="font-semibold text-blue-300">Camera Account required.</span>{' '}
            These credentials are a <span className="font-semibold">separate account</span> created inside the Tapo app —
            not your Tapo login. Open the Tapo app → camera → Settings → Advanced Settings → Camera Account, then create a username and password.
          </p>
        </div>

        {formError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Name & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Camera Name *</label>
            <input
              id="camera-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Driveway TC40"
              className="w-full bg-[#161921] border border-[#242933] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Physical Location / Zone</label>
            <input
              id="camera-location-input"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. South Perimeter"
              className="w-full bg-[#161921] border border-[#242933] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Network & RTSP */}
        <div className="p-4 bg-[#161921]/60 border border-[#242933] rounded-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-blue-400" />
            Network & Stream Configuration
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1">IP Address *</label>
              <input
                id="camera-ip-input"
                type="text"
                required
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.110"
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                RTSP Port
                <span className="ml-1 text-gray-500 font-normal">(default 554)</span>
              </label>
              <input
                id="camera-port-input"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) || 554 })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Main Stream
                <span className="ml-1 text-gray-500 font-normal">— high quality (2K)</span>
              </label>
              <input
                type="text"
                value={formData.rtspStreamPath}
                onChange={(e) => setFormData({ ...formData, rtspStreamPath: e.target.value })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Sub Stream
                <span className="ml-1 text-gray-500 font-normal">— standard quality (360p)</span>
              </label>
              <input
                type="text"
                value={formData.subStreamPath}
                onChange={(e) => setFormData({ ...formData, subStreamPath: e.target.value })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live RTSP URL Preview */}
          {rtspPreview && (
            <div className="mt-1 p-2.5 bg-[#0A0C10] border border-[#242933] rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">RTSP Stream URL Preview</p>
              <p className="font-mono text-[11px] text-emerald-400 break-all">{rtspPreview}</p>
            </div>
          )}
        </div>

        {/* Camera Account Credentials */}
        <div className="p-4 bg-[#161921]/60 border border-[#242933] rounded-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Camera Account Credentials
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
              <input
                id="camera-username-input"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Password
                {initialCamera?.hasPassword && (
                  <span className="ml-1 text-gray-500 font-normal">(leave blank to keep existing)</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="camera-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Camera account password"
                  className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg pl-3 pr-9 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* ONVIF port for PTZ */}
          <div className="flex items-center gap-3">
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                ONVIF Port
                <span className="ml-1 text-gray-500 font-normal">(PTZ)</span>
              </label>
              <input
                type="number"
                value={formData.onvifPort ?? 2020}
                onChange={(e) => setFormData({ ...formData, onvifPort: Number(e.target.value) || 2020 })}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
              Used for Pan/Tilt/Zoom control via ONVIF Profile S.
              Tapo default is <span className="font-mono text-gray-400">2020</span>.
            </p>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 bg-[#161921]/40 border border-[#242933] rounded-lg cursor-pointer hover:bg-[#161921]/70 transition">
            <input
              type="checkbox"
              checked={formData.panTiltSupported}
              onChange={(e) => setFormData({ ...formData, panTiltSupported: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-[#0A0C10] border-[#242933] focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-semibold text-gray-200 block">Pan/Tilt Supported</span>
              <span className="text-[11px] text-gray-400 block">Enable PTZ directional controls</span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 bg-[#161921]/40 border border-[#242933] rounded-lg cursor-pointer hover:bg-[#161921]/70 transition">
            <input
              type="checkbox"
              checked={formData.recordingEnabled}
              onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-[#0A0C10] border-[#242933] focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-semibold text-gray-200 block">Enable Recording</span>
              <span className="text-[11px] text-gray-400 block">Allow FFmpeg to save video segments</span>
            </div>
          </label>
        </div>

        {/* Connection Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg border text-xs font-mono ${
            testResult.success
              ? 'bg-green-950/40 border-green-500/40 text-green-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              }
              <span>{testResult.message}</span>
            </div>
            {testResult.success && testResult.latencyMs && (
              <div className="mt-1 text-[11px] text-gray-300">
                Latency: {testResult.latencyMs}ms
                {testResult.discoveredResolution && ` | Stream: ${testResult.discoveredResolution} @ ${testResult.discoveredFps} FPS`}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#242933]">
          <button
            id="test-camera-connection-btn"
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 text-xs font-semibold text-gray-300 bg-[#161921] hover:bg-[#1A1E26] hover:text-white rounded-lg border border-[#242933] flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              : <Network className="w-3.5 h-3.5 text-blue-400" />
            }
            <span>{isTesting ? 'Testing RTSP...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#161921] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-camera-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{initialCamera ? 'Save Changes' : 'Register Camera'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};