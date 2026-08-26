import React, { useState } from 'react';
import { Camera } from '../../types';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Sliders,
  ZoomIn,
  ZoomOut,
  Crosshair,
  RefreshCcw
} from 'lucide-react';

interface CameraControlsProps {
  camera: Camera;
  onPtzControl: (id: string, action: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'preset_home' | 'stop') => Promise<any>;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  camera,
  onPtzControl
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const handlePtzAction = async (action: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'preset_home' | 'stop', label: string) => {
    try {
      setIsMoving(true);
      setActiveDirection(label);
      await onPtzControl(camera.id, action);
      setTimeout(() => {
        setIsMoving(false);
        setActiveDirection(null);
      }, 250);
    } catch (err) {
      console.error(err);
      setIsMoving(false);
      setActiveDirection(null);
    }
  };

  return (
    <div id="camera-ptz-controls-panel" className="bg-[#161921] border border-[#242933] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[#242933] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
            Tapo TC40 Pan / Tilt Motor
          </h4>
        </div>
        <div className="text-[11px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
          PAN: {camera.ptzCurrentPosition?.pan ?? 0}° | TILT: {camera.ptzCurrentPosition?.tilt ?? 0}°
        </div>
      </div>

      {/* PTZ D-Pad Joystick */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-36 h-36 bg-[#0A0C10] rounded-full border-2 border-[#242933] flex items-center justify-center p-2 shadow-inner">
          {/* UP Button */}
          <button
            id="ptz-up"
            type="button"
            onClick={() => handlePtzAction('tilt_up', 'TILT UP')}
            className={`absolute top-2 w-9 h-9 rounded-full bg-[#1A1E26] hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#242933] ${
              activeDirection === 'TILT UP' ? 'bg-blue-600 scale-95 text-white' : ''
            }`}
            title="Tilt Up"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* LEFT Button */}
          <button
            id="ptz-left"
            type="button"
            onClick={() => handlePtzAction('pan_left', 'PAN LEFT')}
            className={`absolute left-2 w-9 h-9 rounded-full bg-[#1A1E26] hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#242933] ${
              activeDirection === 'PAN LEFT' ? 'bg-blue-600 scale-95 text-white' : ''
            }`}
            title="Pan Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* CENTER HOME Button */}
          <button
            id="ptz-home"
            type="button"
            onClick={() => handlePtzAction('preset_home', 'HOME PRESET')}
            className="w-10 h-10 rounded-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-400 hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
            title="Reset to Home Angle"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* RIGHT Button */}
          <button
            id="ptz-right"
            type="button"
            onClick={() => handlePtzAction('pan_right', 'PAN RIGHT')}
            className={`absolute right-2 w-9 h-9 rounded-full bg-[#1A1E26] hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#242933] ${
              activeDirection === 'PAN RIGHT' ? 'bg-blue-600 scale-95 text-white' : ''
            }`}
            title="Pan Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* DOWN Button */}
          <button
            id="ptz-down"
            type="button"
            onClick={() => handlePtzAction('tilt_down', 'TILT DOWN')}
            className={`absolute bottom-2 w-9 h-9 rounded-full bg-[#1A1E26] hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#242933] ${
              activeDirection === 'TILT DOWN' ? 'bg-blue-600 scale-95 text-white' : ''
            }`}
            title="Tilt Down"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] font-mono text-gray-400 mt-2">
          {isMoving ? `Adjusting: ${activeDirection}` : 'Click direction to rotate camera'}
        </p>
      </div>

      {/* Preset quick positions for Tapo TC40 */}
      <div className="border-t border-[#242933] pt-3">
        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-2">
          Patrol Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handlePtzAction('pan_left', 'PRESET 1')}
            className="px-2 py-1.5 bg-[#1A1E26] hover:bg-[#242933] text-gray-300 rounded text-xs font-mono transition-colors text-center border border-[#242933] cursor-pointer"
          >
            Gate View
          </button>
          <button
            type="button"
            onClick={() => handlePtzAction('preset_home', 'PRESET HOME')}
            className="px-2 py-1.5 bg-[#1A1E26] hover:bg-[#242933] text-gray-300 rounded text-xs font-mono transition-colors text-center border border-[#242933] cursor-pointer"
          >
            Center Porch
          </button>
          <button
            type="button"
            onClick={() => handlePtzAction('pan_right', 'PRESET 3')}
            className="px-2 py-1.5 bg-[#1A1E26] hover:bg-[#242933] text-gray-300 rounded text-xs font-mono transition-colors text-center border border-[#242933] cursor-pointer"
          >
            Yard Corner
          </button>
        </div>
      </div>
    </div>
  );
};
