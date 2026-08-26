"""
Camera services for RTSP connection, ONVIF control, and stream management.
NOTE: OpenCV and FFmpeg functionality commented out for basic operation.
Install opencv-python to enable full functionality.
"""

import time
import socket
import json
import os
import subprocess
import threading
from typing import Dict, Any, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from django.http import FileResponse, Http404
from .models import Camera, CameraSnapshot
import logging

logger = logging.getLogger(__name__)


class RTSPService:
    """
    Service for handling RTSP connections and stream testing.
    """
    
    @staticmethod
    def test_connection(camera_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test RTSP connection to camera and gather stream information.
        """
        start_time = time.time()
        
        try:
            rtsp_url = RTSPService._build_rtsp_url(camera_data)
            
            # Test network connectivity first
            ping_result = RTSPService._test_ping(
                camera_data.get('ip_address'),
                camera_data.get('port', 554)
            )
            
            if not ping_result:
                return {
                    'success': False,
                    'message': 'Camera not reachable on network',
                    'latency_ms': int((time.time() - start_time) * 1000),
                    'rtsp_url_checked': RTSPService._redact_rtsp_url(rtsp_url),
                    'details': {
                        'pingOk': False,
                        'rtspHandshakeOk': False,
                        'authOk': False
                    }
                }
            
            probe = RTSPService._probe_stream(rtsp_url)
            latency_ms = int((time.time() - start_time) * 1000)

            if not probe['success']:
                return {
                    'success': False,
                    'message': probe['message'],
                    'latency_ms': latency_ms,
                    'rtsp_url_checked': RTSPService._redact_rtsp_url(rtsp_url),
                    'details': {
                        'pingOk': True,
                        'rtspHandshakeOk': probe['handshake_ok'],
                        'authOk': probe['auth_ok']
                    }
                }
            
            return {
                'success': True,
                'message': 'Camera RTSP stream and credentials verified',
                'latency_ms': latency_ms,
                'discovered_resolution': probe['resolution'],
                'discovered_fps': probe['fps'],
                'rtsp_url_checked': RTSPService._redact_rtsp_url(rtsp_url),
                'details': {
                    'pingOk': True,
                    'rtspHandshakeOk': True,
                    'authOk': True
                }
            }
                
        except Exception as e:
            logger.error(f"Connection test error: {str(e)}")
            return {
                'success': False,
                'message': f'Connection test failed: {str(e)}',
                'latency_ms': int((time.time() - start_time) * 1000),
                'details': {
                    'pingOk': False,
                    'rtspHandshakeOk': False,
                    'authOk': False
                }
            }
    
    @staticmethod
    def _build_rtsp_url(camera_data: Dict[str, Any]) -> str:
        """
        Build RTSP URL using Tapo official format.
        Standard: rtsp://username:password@IP_ADDRESS/stream1
        Port 554 is omitted (default). Non-standard ports are included.
        """
        username = camera_data.get('username', 'admin')
        password = camera_data.get('password', '')
        ip_address = camera_data.get('ip_address')
        port = camera_data.get('port', 554)
        stream_path = camera_data.get('rtsp_stream_path', '/stream1')
        
        auth = f"{username}:{password}" if password else username
        
        if port and port != 554:
            return f"rtsp://{auth}@{ip_address}:{port}{stream_path}"
        # Standard Tapo format — no port
        return f"rtsp://{auth}@{ip_address}{stream_path}"
    
    @staticmethod
    def _test_ping(ip_address: str, port: int) -> bool:
        """Test network connectivity to camera."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((ip_address, port))
            sock.close()
            return result == 0
        except Exception:
            return False

    @staticmethod
    def _redact_rtsp_url(rtsp_url: str) -> str:
        """Hide camera credentials from API diagnostics and UI messages."""
        if '://' not in rtsp_url or '@' not in rtsp_url:
            return rtsp_url
        scheme, remainder = rtsp_url.split('://', 1)
        credentials, host = remainder.rsplit('@', 1)
        username = credentials.split(':', 1)[0]
        return f'{scheme}://{username}:********@{host}'

    @staticmethod
    def _probe_stream(rtsp_url: str) -> Dict[str, Any]:
        """Use ffprobe to validate RTSP authentication and inspect the video stream."""
        ffprobe = settings.SURVEILLANCE_CONFIG.get('FFPROBE_PATH', 'ffprobe')
        command = [
            ffprobe, '-v', 'error', '-rtsp_transport', 'tcp',
            '-show_entries', 'stream=codec_type,width,height,avg_frame_rate',
            '-of', 'json', rtsp_url
        ]
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=settings.SURVEILLANCE_CONFIG['RTSP_CONNECTION_TIMEOUT']
            )
        except FileNotFoundError:
            return {
                'success': False,
                'message': 'ffprobe was not found. Install FFmpeg and add it to PATH.',
                'handshake_ok': False,
                'auth_ok': False
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'message': 'RTSP probe timed out. Check the camera account and stream path.',
                'handshake_ok': False,
                'auth_ok': False
            }

        if result.returncode != 0:
            error = result.stderr.strip().lower()
            auth_failed = '401' in error or 'unauthorized' in error or 'authentication' in error
            return {
                'success': False,
                'message': 'RTSP authentication failed.' if auth_failed else 'RTSP handshake failed. Check the stream path and camera settings.',
                'handshake_ok': True,
                'auth_ok': not auth_failed
            }

        try:
            streams = json.loads(result.stdout).get('streams', [])
            video = next(stream for stream in streams if stream.get('codec_type') == 'video')
            frame_rate = video.get('avg_frame_rate', '0/1').split('/')
            fps = round(float(frame_rate[0]) / float(frame_rate[1])) if float(frame_rate[1]) else 0
            return {
                'success': True,
                'resolution': f"{video.get('width', 0)}x{video.get('height', 0)}",
                'fps': fps,
                'handshake_ok': True,
                'auth_ok': True
            }
        except (StopIteration, ValueError, ZeroDivisionError, TypeError, json.JSONDecodeError):
            return {
                'success': False,
                'message': 'RTSP connected but no usable video stream was found.',
                'handshake_ok': True,
                'auth_ok': True
            }


class ONVIFService:
    """
    Service for ONVIF PTZ control and device management.
    """
    
    @staticmethod
    def ptz_control(camera: Camera, action: str) -> Dict[str, Any]:
        """Execute an authenticated ONVIF Profile S PTZ command."""
        if not camera.pan_tilt_supported:
            return {
                'success': False,
                'message': 'PTZ not supported on this camera'
            }
        
        if action not in ('pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'preset_home', 'stop'):
            return {'success': False, 'message': f'Unknown PTZ action: {action}'}

        try:
            from onvif import ONVIFCamera
            import onvif

            wsdl_candidates = [
                os.path.join(os.path.dirname(onvif.__file__), '..', '..', '..', 'Lib', 'site-packages', 'wsdl'),
                os.path.join(os.path.dirname(onvif.__file__), 'wsdl'),
            ]
            wsdl_dir = next((os.path.abspath(path) for path in wsdl_candidates if os.path.isfile(os.path.join(path, 'devicemgmt.wsdl'))), None)
            if wsdl_dir is None:
                return {'success': False, 'message': 'ONVIF WSDL files are not installed.'}

            onvif = ONVIFCamera(
                camera.ip_address,
                camera.onvif_port or 2020,
                camera.username,
                camera.password,
                wsdl_dir=wsdl_dir
            )
            media = onvif.create_media_service()
            ptz = onvif.create_ptz_service()
            profiles = media.GetProfiles()
            profile = next((item for item in profiles if getattr(item, 'PTZConfiguration', None)), None)
            if profile is None:
                return {
                    'success': False,
                    'message': 'The camera did not expose an ONVIF PTZ profile.'
                }

            token = profile.token
            if action == 'preset_home':
                ptz.GotoHomePosition({'ProfileToken': token})
            elif action == 'stop':
                ptz.Stop({'ProfileToken': token, 'PanTilt': True, 'Zoom': True})
            else:
                velocities = {
                    'pan_left': (-0.5, 0), 'pan_right': (0.5, 0),
                    'tilt_up': (0, 0.5), 'tilt_down': (0, -0.5)
                }
                pan, tilt = velocities[action]
                ptz.ContinuousMove({
                    'ProfileToken': token,
                    'Velocity': {'PanTilt': {'x': pan, 'y': tilt}}
                })
                time.sleep(0.4)
                ptz.Stop({'ProfileToken': token, 'PanTilt': True, 'Zoom': False})

            status = ptz.GetStatus({'ProfileToken': token})
            position = getattr(getattr(status, 'Position', None), 'PanTilt', None)
            pan = getattr(position, 'x', camera.ptz_current_pan) if position else camera.ptz_current_pan
            tilt = getattr(position, 'y', camera.ptz_current_tilt) if position else camera.ptz_current_tilt
            camera.update_ptz_position(pan=pan, tilt=tilt)
            return {
                'success': True,
                'message': f'PTZ {action} completed',
                'position': camera.ptz_position
            }
        except Exception as e:
            logger.error(f"PTZ control error: {str(e)}")
            return {
                'success': False,
                'message': f'ONVIF PTZ failed: {str(e)}'
            }


class SnapshotService:
    """
    Service for capturing camera snapshots.
    """
    
    @staticmethod
    def capture_snapshot(camera: Camera) -> Dict[str, Any]:
        """Capture a snapshot from camera (requires OpenCV)."""
        try:
            if not camera.is_online:
                return {
                    'success': False,
                    'message': 'Camera is offline'
                }
            
            # Simulated snapshot (OpenCV would be used here)
            return {
                'success': True,
                'message': 'Snapshot feature requires OpenCV installation',
                'filename': f'{camera.name}_snapshot.jpg',
                'file_path': ''
            }
            
        except Exception as e:
            logger.error(f"Snapshot capture error: {str(e)}")
            return {
                'success': False,
                'message': f'Snapshot failed: {str(e)}'
            }


class StreamService:
    """
    Service for managing live video streams.
    """
    
    _processes: Dict[str, subprocess.Popen] = {}
    _lock = threading.Lock()

    @classmethod
    def get_hls_stream_url(cls, camera: Camera, profile: str = 'main') -> Optional[str]:
        """Start HLS conversion and return the browser-safe playlist URL."""
        if profile not in ('main', 'sub'):
            profile = 'main'
        if not camera.is_online or not cls.start_hls_conversion(camera, profile):
            return None
        return f'/api/cameras/{camera.id}/stream.m3u8?profile={profile}'

    @classmethod
    def start_hls_conversion(cls, camera: Camera, profile: str = 'main') -> bool:
        """Start one FFmpeg HLS process per camera."""
        camera_id = str(camera.id)
        profile = profile if profile in ('main', 'sub') else 'main'
        process_key = f'{camera_id}:{profile}'
        with cls._lock:
            process = cls._processes.get(process_key)
            if process and process.poll() is None:
                return True

            output_dir = os.path.join(settings.SURVEILLANCE_CONFIG['TEMP_PATH'], 'hls', camera_id, profile)
            os.makedirs(output_dir, exist_ok=True)
            playlist = os.path.join(output_dir, 'index.m3u8')
            segment_pattern = os.path.join(output_dir, 'segment_%03d.ts')
            if os.path.isfile(playlist) and time.time() - os.path.getmtime(playlist) < 4:
                return True
            for filename in os.listdir(output_dir):
                if filename.endswith(('.ts', '.m3u8')):
                    os.remove(os.path.join(output_dir, filename))
            command = [
                settings.SURVEILLANCE_CONFIG['FFMPEG_PATH'], '-hide_banner', '-loglevel', 'error',
                '-fflags', '+genpts+discardcorrupt', '-rtsp_transport', 'tcp',
                '-i', camera.rtsp_url if profile == 'main' else camera.rtsp_sub_url,
                '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'fps=15', '-r', '15',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
                '-pix_fmt', 'yuv420p', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
                '-force_key_frames', 'expr:gte(t,n_forced*2)',
                '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2', '-f', 'hls',
                '-hls_time', '2', '-hls_list_size', '4',
                '-hls_flags', 'delete_segments+independent_segments', '-avoid_negative_ts', 'make_zero',
                '-hls_base_url', f'/api/cameras/{camera_id}/stream/{profile}/',
                '-hls_segment_filename', segment_pattern, playlist
            ]
            try:
                process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            except FileNotFoundError:
                logger.error('FFmpeg was not found while starting HLS for %s', camera.name)
                return False
            cls._processes[process_key] = process
            return True

    @classmethod
    def get_hls_file(cls, camera: Camera, filename: str, profile: str = 'main') -> FileResponse:
        """Serve a generated playlist or segment without exposing the RTSP URL."""
        if os.path.basename(filename) != filename:
            raise Http404
        profile = profile if profile in ('main', 'sub') else 'main'
        path = cls.get_hls_path(camera, filename, profile)
        if not os.path.isfile(path):
            raise Http404
        content_type = 'application/vnd.apple.mpegurl' if filename.endswith('.m3u8') else 'video/mp2t'
        return FileResponse(open(path, 'rb'), content_type=content_type)

    @classmethod
    def get_hls_path(cls, camera: Camera, filename: str, profile: str = 'main') -> str:
        profile = profile if profile in ('main', 'sub') else 'main'
        return os.path.join(settings.SURVEILLANCE_CONFIG['TEMP_PATH'], 'hls', str(camera.id), profile, filename)