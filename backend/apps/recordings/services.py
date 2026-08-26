"""
Recording services for video capture, processing, and management.
"""

import os
import subprocess
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone
from .models import Recording
from apps.cameras.models import Camera
from apps.system.models import SystemSettings
import logging

logger = logging.getLogger(__name__)


class RecordingService:
    """
    Service for managing video recordings using FFmpeg.
    """
    
    # Class-level registry of active recording processes
    _active_recordings = {}
    _lock = threading.Lock()
    
    @classmethod
    def start_recording(cls, camera: Camera, duration_seconds: Optional[int] = None, trigger_type: str = 'MANUAL') -> Dict[str, Any]:
        """
        Start recording video from camera.
        
        Args:
            camera: Camera instance to record from
            duration_seconds: Recording duration (None for indefinite)
            trigger_type: Type of trigger that started recording
            
        Returns:
            Dictionary with operation result
        """
        try:
            if not camera.is_online:
                return {
                    'success': False,
                    'message': 'Camera is offline'
                }
            
            if camera.is_recording:
                return {
                    'success': False,
                    'message': 'Camera is already recording'
                }
            
            # Check if we've reached max concurrent recordings
            with cls._lock:
                active_count = len(cls._active_recordings)
                max_concurrent = settings.SURVEILLANCE_CONFIG['MAX_CONCURRENT_RECORDINGS']
                
                if active_count >= max_concurrent:
                    return {
                        'success': False,
                        'message': f'Maximum concurrent recordings ({max_concurrent}) reached'
                    }
            
            # Create recording record
            recording = Recording.objects.create(
                camera=camera,
                start_time=timezone.now(),
                trigger_type=trigger_type,
                status=Recording.RecordingStatus.RECORDING,
                resolution=camera.resolution,
                fps=camera.fps,
                bitrate_kbps=camera.bitrate_kbps
            )
            
            # Generate output file path
            timestamp = recording.start_time.strftime('%Y%m%d_%H%M%S')
            filename = f"{camera.name.replace(' ', '_')}_{timestamp}.mp4"
            storage_path = SystemSettings.get_settings().storage_location
            os.makedirs(storage_path, exist_ok=True)
            output_path = os.path.join(storage_path, filename)
            
            recording.storage_file_path = output_path
            recording.save()
            
            # Start FFmpeg recording process
            result = cls._start_ffmpeg_recording(camera, recording, duration_seconds)
            
            if result['success']:
                # Register active recording
                with cls._lock:
                    cls._active_recordings[str(recording.id)] = {
                        'recording': recording,
                        'process': result['process'],
                        'camera': camera,
                        'start_time': time.time()
                    }

                threading.Thread(
                    target=cls._monitor_recording,
                    args=(str(recording.id),),
                    daemon=True
                ).start()
                
                logger.info(f"Started recording {recording.id} for camera {camera.name}")
                
                return {
                    'success': True,
                    'message': f'Recording started for {camera.name}',
                    'recording_id': str(recording.id),
                    'output_path': output_path
                }
            else:
                # Mark recording as failed
                recording.mark_failed()
                return result
                
        except Exception as e:
            logger.error(f"Failed to start recording for camera {camera.id}: {str(e)}")
            return {
                'success': False,
                'message': f'Recording failed to start: {str(e)}'
            }
    
    @classmethod
    def stop_recording(cls, camera: Camera) -> Dict[str, Any]:
        """
        Stop active recording on camera.
        
        Args:
            camera: Camera instance to stop recording
            
        Returns:
            Dictionary with operation result
        """
        try:
            # Find active recording for this camera
            recording_entry = None
            recording_id = None
            
            with cls._lock:
                for rid, entry in cls._active_recordings.items():
                    if entry['camera'].id == camera.id:
                        recording_entry = entry
                        recording_id = rid
                        break
            
            if not recording_entry:
                return {
                    'success': False,
                    'message': 'No active recording found for this camera'
                }
            
            # Stop FFmpeg process
            process = recording_entry['process']
            recording = recording_entry['recording']
            
            try:
                if process.stdin:
                    process.stdin.write(b'q\n')
                    process.stdin.flush()
                process.wait(timeout=10)  # Wait up to 10 seconds
            except subprocess.TimeoutExpired:
                # Force kill if graceful shutdown fails
                process.kill()
                process.wait()

            process_error = ''
            if process.stderr:
                process_error = process.stderr.read().decode(errors='replace').strip()
            
            # Remove from active recordings
            with cls._lock:
                cls._active_recordings.pop(recording_id, None)
            
            # Update recording record
            if process.returncode not in (0, 255):
                reason = process_error or f'FFmpeg exited with code {process.returncode}'
                recording.mark_failed(reason)
                return {'success': False, 'message': f'Recording failed: {reason}'}
            if not recording.storage_file_path or not os.path.isfile(recording.storage_file_path) or os.path.getsize(recording.storage_file_path) == 0:
                reason = process_error or 'FFmpeg stopped without creating a video file'
                recording.mark_failed(reason)
                return {'success': False, 'message': f'Recording failed: {reason}'}
            recording.complete_recording()
            
            logger.info(f"Stopped recording {recording.id} for camera {camera.name}")
            
            return {
                'success': True,
                'message': f'Recording stopped for {camera.name}',
                'recording_id': str(recording.id),
                'duration_seconds': recording.duration_seconds,
                'file_size_mb': recording.file_size_mb
            }
            
        except Exception as e:
            logger.error(f"Failed to stop recording for camera {camera.id}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to stop recording: {str(e)}'
            }
    
    @classmethod
    def _start_ffmpeg_recording(cls, camera: Camera, recording: Recording, duration_seconds: Optional[int]) -> Dict[str, Any]:
        """
        Start an FFmpeg process that copies the camera stream into an MP4 file.
        """
        try:
            command = [
                settings.SURVEILLANCE_CONFIG['FFMPEG_PATH'], '-hide_banner', '-loglevel', 'error',
                '-rtsp_transport', 'tcp', '-i', camera.rtsp_url,
                '-map', '0:v:0', '-map', '0:a:0?', '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2'
            ]
            if duration_seconds:
                command.extend(['-t', str(duration_seconds)])
            command.extend(['-movflags', '+faststart', recording.storage_file_path])
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE
            )
            return {
                'success': True,
                'process': process,
                'command': command
            }
        except FileNotFoundError:
            return {
                'success': False,
                'message': 'FFmpeg was not found. Install FFmpeg and add it to PATH.'
            }
        except Exception as e:
            logger.error(f"Failed to start FFmpeg for recording {recording.id}: {str(e)}")
            return {
                'success': False,
                'message': f'FFmpeg failed to start: {str(e)}'
            }
    
    @classmethod
    def _monitor_recording(cls, recording_id: str):
        with cls._lock:
            entry = cls._active_recordings.get(recording_id)

        if not entry:
            return

        process = entry['process']
        recording = entry['recording']
        camera = entry['camera']
        return_code = process.wait()
        process_error = process.stderr.read().decode(errors='replace').strip() if process.stderr else ''

        with cls._lock:
            active_entry = cls._active_recordings.pop(recording_id, None)

        if active_entry is None:
            return

        if return_code in (0, 255) and recording.storage_file_path and os.path.isfile(recording.storage_file_path) and os.path.getsize(recording.storage_file_path) > 0:
            recording.complete_recording()
        else:
            recording.mark_failed(process_error or f'FFmpeg exited with code {return_code}')

        camera.set_recording_state(False)
    
    @classmethod
    def get_active_recordings(cls) -> List[Dict[str, Any]]:
        """
        Get list of currently active recordings.
        
        Returns:
            List of active recording info
        """
        active_list = []
        
        with cls._lock:
            for recording_id, entry in cls._active_recordings.items():
                recording = entry['recording']
                camera = entry['camera']
                start_time = entry['start_time']
                
                active_list.append({
                    'recording_id': recording_id,
                    'camera_id': str(camera.id),
                    'camera_name': camera.name,
                    'start_time': recording.start_time.isoformat(),
                    'duration_seconds': int(time.time() - start_time),
                    'output_path': recording.storage_file_path
                })
        
        return active_list
    
    @classmethod
    def cleanup_old_recordings(cls, retention_days: int) -> Dict[str, Any]:
        """
        Clean up recordings older than retention period.
        
        Args:
            retention_days: Number of days to keep recordings
            
        Returns:
            Dictionary with cleanup results
        """
        try:
            cutoff_date = timezone.now() - timedelta(days=retention_days)
            
            # Find old recordings
            old_recordings = Recording.objects.filter(
                start_time__lt=cutoff_date,
                status=Recording.RecordingStatus.COMPLETED
            )
            
            deleted_count = 0
            freed_bytes = 0
            
            for recording in old_recordings:
                # Delete file if it exists
                if recording.storage_file_path and os.path.exists(recording.storage_file_path):
                    file_size = os.path.getsize(recording.storage_file_path)
                    os.remove(recording.storage_file_path)
                    freed_bytes += file_size
                
                # Delete database record
                recording.delete()
                deleted_count += 1
            
            freed_gb = freed_bytes / (1024 ** 3)
            
            logger.info(f"Cleanup completed: {deleted_count} recordings deleted, {freed_gb:.2f} GB freed")
            
            return {
                'success': True,
                'deleted_count': deleted_count,
                'freed_bytes': freed_bytes,
                'freed_gb': round(freed_gb, 2)
            }
            
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}'
            }