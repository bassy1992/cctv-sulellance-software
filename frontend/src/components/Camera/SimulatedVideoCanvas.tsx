import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera } from '../../types';
import { VideoOff, RefreshCw } from 'lucide-react';

interface SimulatedVideoCanvasProps {
  camera: Camera;
  className?: string;
  isEnlarged?: boolean;
  onSnapshotReady?: (canvas: HTMLCanvasElement) => void;
}

export const SimulatedVideoCanvas: React.FC<SimulatedVideoCanvasProps> = ({
  camera,
  className = '',
  isEnlarged = false,
  onSnapshotReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [fpsVal, setFpsVal] = useState<number>(camera.fps || 25);

  const isOffline = camera.status === 'OFFLINE' || camera.status === 'ERROR';
  const isConnecting = camera.status === 'CONNECTING';

  const renderFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    if (isOffline) {
      // Draw offline noise pattern
      ctx.fillStyle = '#060A11';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Seeded background visuals based on camera ID & location
    const seed = camera.id.charCodeAt(camera.id.length - 1) * 37;
    const panOffset = (camera.ptzCurrentPosition?.pan || 0) * (width / 300);
    const tiltOffset = (camera.ptzCurrentPosition?.tilt || 0) * (height / 200);

    // Realistic outdoor surveillance background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (camera.id === 'cam-01') {
      // Porch / Walkway
      grad.addColorStop(0, '#101726');
      grad.addColorStop(0.5, '#152033');
      grad.addColorStop(1, '#0C1322');
    } else if (camera.id === 'cam-02') {
      // Driveway
      grad.addColorStop(0, '#0F1A2E');
      grad.addColorStop(0.6, '#18243B');
      grad.addColorStop(1, '#111728');
    } else if (camera.id === 'cam-03') {
      // Backyard Lawn
      grad.addColorStop(0, '#0B1B22');
      grad.addColorStop(0.6, '#11292B');
      grad.addColorStop(1, '#091517');
    } else {
      // General Yard / Garage
      grad.addColorStop(0, '#131B29');
      grad.addColorStop(1, '#0B101D');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw architectural environment elements (perspective driveway, walls, horizon)
    ctx.save();
    ctx.translate(panOffset * 0.5, tiltOffset * 0.5);

    // Horizon line & ground plane
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-50, height * 0.45);
    ctx.lineTo(width + 50, height * 0.45);
    ctx.stroke();

    // Perspective lines (driveway / fence / floor tiles)
    ctx.strokeStyle = '#1A2333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Center pathway
    ctx.moveTo(width * 0.35, height * 0.45);
    ctx.lineTo(width * 0.1, height + 50);
    ctx.moveTo(width * 0.65, height * 0.45);
    ctx.lineTo(width * 0.9, height + 50);
    // Wall / building outline
    ctx.moveTo(width * 0.05, height * 0.1);
    ctx.lineTo(width * 0.05, height * 0.7);
    ctx.stroke();

    // Simulated subtle ambient motion (e.g. tree leaves swaying or shadow moving)
    const sway = Math.sin(time / 800 + seed) * 12;
    ctx.fillStyle = '#1A2938';
    ctx.beginPath();
    ctx.arc(width * 0.85 + sway * 0.4, height * 0.35 + sway * 0.2, 45, 0, Math.PI * 2);
    ctx.fill();

    // Subtle motion detection bounding box simulation on camera 01 or 02
    if (camera.isRecording || camera.id === 'cam-01') {
      const boxX = width * 0.42 + Math.sin(time / 2000) * 20;
      const boxY = height * 0.48;
      const boxW = width * 0.16;
      const boxH = height * 0.32;

      // Smart AI human/vehicle detection box
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      // Label on box
      ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.fillRect(boxX, boxY - 18, 92, 18);
      ctx.fillStyle = '#062016';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('HUMAN 94%', boxX + 4, boxY - 5);
    }

    ctx.restore();

    // Surveillance Lens Grain & Vignette
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width / 4,
      width / 2, height / 2, width / 1.5
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // OSD Header Bar (Tapo TC40 Style Overlays)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    // Top Left: Camera Name + PTZ pan/tilt coordinates
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(8, 8, isEnlarged ? 360 : 240, 24);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${camera.name.toUpperCase()}`, 14, 24);

    if (camera.panTiltSupported && isEnlarged) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px monospace';
      ctx.fillText(`PT: [P:${camera.ptzCurrentPosition?.pan ?? 0}° T:${camera.ptzCurrentPosition?.tilt ?? 0}°]`, 210, 24);
    }

    // Top Right: Live Date & Time Stamp (Essential for legal CCTV evidence)
    const timeText = `${dateStr}  ${timeStr}`;
    ctx.font = 'bold 12px monospace';
    const textWidth = ctx.measureText(timeText).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(width - textWidth - 20, 8, textWidth + 14, 24);
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(timeText, width - textWidth - 14, 24);

    // Bottom Left: Stream Telemetry (FPS, Bitrate, Resolution)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(8, height - 28, isEnlarged ? 380 : 210, 20);
    ctx.fillStyle = '#10B981';
    ctx.font = '10px monospace';
    const telemetryText = `${camera.resolution} | ${camera.fps}fps | ${camera.bitrateKbps}kbps`;
    ctx.fillText(telemetryText, 14, height - 14);

    // Bottom Right: TAPO TC40 Hardware Watermark
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('TAPO TC40 VMS', width - 95, height - 14);

    // Blinking Recording Beacon if recording
    if (camera.isRecording) {
      const isBlinkOn = Math.floor(time / 500) % 2 === 0;
      if (isBlinkOn) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(width - 24, 48, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('REC', width - 56, 52);
      }
    }
  }, [camera, isOffline, isEnlarged]);

  useEffect(() => {
    let active = true;

    const loop = (time: number) => {
      if (!active) return;
      renderFrame(time);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderFrame]);

  // Hook for taking snapshot from canvas
  useEffect(() => {
    if (onSnapshotReady && canvasRef.current) {
      onSnapshotReady(canvasRef.current);
    }
  }, [onSnapshotReady]);

  return (
    <div
      id={`canvas-container-${camera.id}`}
      className={`relative w-full aspect-video bg-slate-950 overflow-hidden flex items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={isEnlarged ? 1280 : 640}
        height={isEnlarged ? 720 : 360}
        className="w-full h-full object-cover"
      />

      {/* Offline state overlay */}
      {isOffline && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-full mb-3">
            <VideoOff className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Camera Feed Offline</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {camera.errorReason || `RTSP stream disconnected on ${camera.ipAddress}:${camera.port}`}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span>RTSP://{camera.ipAddress}:{camera.port}{camera.rtspStreamPath}</span>
          </div>
        </div>
      )}

      {/* Connecting state overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4 text-center">
          <RefreshCw className="w-7 h-7 text-amber-400 animate-spin mb-2" />
          <p className="text-xs font-mono text-amber-300">Connecting RTSP Stream...</p>
        </div>
      )}
    </div>
  );
};
