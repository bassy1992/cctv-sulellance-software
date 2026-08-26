"""
System services for health monitoring, events, and configuration.
"""

import psutil
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.utils import timezone
from .models import SystemSettings, SurveillanceEvent, SystemHealth
from apps.cameras.models import Camera
from apps.recordings.models import Recording
from apps.recordings.services import RecordingService
import logging

logger = logging.getLogger(__name__)


class SystemHealthService:
    """
    Service for monitoring system health and performance.
    """
    
    @staticmethod
    def get_system_health() -> Dict[str, Any]:
        """
        Get comprehensive system health information.
        
        Returns:
            Dictionary with system health data
        """
        try:
            # Get camera statistics
            total_cameras = Camera.objects.count()
            online_cameras = Camera.objects.filter(status='ONLINE').count()
            offline_cameras = total_cameras - online_cameras
            
            # Get active recordings
            active_recordings = RecordingService.get_active_recordings()
            active_recordings_count = len(active_recordings)
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            ram_percent = memory.percent
            
            # Get system uptime (approximate)
            boot_time = psutil.boot_time()
            uptime_seconds = int(time.time() - boot_time)
            
            # FFmpeg instances (approximated by active recordings)
            ffmpeg_instances = active_recordings_count
            
            health_data = {
                'backendStatus': 'CONNECTED',
                'djangoEndpoint': 'http://127.0.0.1:8000/api',
                'activeRecordingsCount': active_recordings_count,
                'totalCameras': total_cameras,
                'onlineCameras': online_cameras,
                'offlineCameras': offline_cameras,
                'cpuUsagePercent': round(cpu_percent, 1),
                'ramUsagePercent': round(ram_percent, 1),
                'ffmpegRunningInstances': ffmpeg_instances,
                'systemUptimeSeconds': uptime_seconds,
                'lastSyncTime': 'Just now'
            }
            
            # Update database record
            health_record = SystemHealth.get_current_health()
            for key, value in health_data.items():
                setattr(health_record, key.lower().replace('status', '_status'), value)
            health_record.save()
            
            return health_data
            
        except Exception as e:
            logger.error(f"Failed to get system health: {str(e)}")
            return {
                'backendStatus': 'DEGRADED',
                'error': str(e)
            }
    
    @staticmethod
    def check_system_alerts() -> List[Dict[str, Any]]:
        """
        Check for system alerts and warnings.
        
        Returns:
            List of system alerts
        """
        alerts = []
        
        try:
            # Check storage usage
            from apps.storage.services import StorageService
            storage_health = StorageService.get_storage_health()
            
            if storage_health['status'] in ['warning', 'critical']:
                alerts.append({
                    'type': 'storage',
                    'severity': storage_health['status'],
                    'message': storage_health['message']
                })
            
            # Check offline cameras
            offline_cameras = Camera.objects.filter(status__in=['OFFLINE', 'ERROR'])
            if offline_cameras.exists():
                alerts.append({
                    'type': 'cameras',
                    'severity': 'warning',
                    'message': f'{offline_cameras.count()} cameras are offline'
                })
            
            # Check system resources
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            
            if cpu_percent > 80:
                alerts.append({
                    'type': 'cpu',
                    'severity': 'warning',
                    'message': f'High CPU usage: {cpu_percent:.1f}%'
                })
            
            if memory_percent > 85:
                alerts.append({
                    'type': 'memory',
                    'severity': 'warning',
                    'message': f'High memory usage: {memory_percent:.1f}%'
                })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to check system alerts: {str(e)}")
            return [{
                'type': 'system',
                'severity': 'error',
                'message': f'Alert check failed: {str(e)}'
            }]


class EventService:
    """
    Service for managing surveillance events and logs.
    """
    
    @staticmethod
    def create_event(
        camera_id: Optional[str],
        camera_name: str,
        event_type: str,
        message: str,
        severity: str = 'INFO',
        metadata: Optional[Dict[str, Any]] = None
    ) -> SurveillanceEvent:
        """
        Create a new surveillance event.
        
        Args:
            camera_id: Camera UUID (optional)
            camera_name: Camera name
            event_type: Type of event
            message: Event message
            severity: Event severity
            metadata: Additional event data
            
        Returns:
            Created SurveillanceEvent instance
        """
        try:
            event = SurveillanceEvent.objects.create(
                camera_id=camera_id,
                camera_name=camera_name,
                event_type=event_type,
                message=message,
                severity=severity,
                metadata=metadata or {}
            )
            
            logger.info(f"Event created: {event_type} - {camera_name} - {message}")
            
            # Trigger real-time notification if WebSocket is available
            try:
                from apps.websockets.services import WebSocketService
                WebSocketService.broadcast_event(event)
            except ImportError:
                pass  # WebSocket service not available
            
            return event
            
        except Exception as e:
            logger.error(f"Failed to create event: {str(e)}")
            raise
    
    @staticmethod
    def get_recent_events(limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent surveillance events.
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of event data dictionaries
        """
        try:
            events = SurveillanceEvent.objects.order_by('-timestamp')[:limit]
            
            event_list = []
            for event in events:
                event_list.append({
                    'id': str(event.id),
                    'timestamp': event.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'cameraId': str(event.camera_id) if event.camera_id else None,
                    'cameraName': event.camera_name,
                    'type': event.event_type,
                    'message': event.message,
                    'severity': event.severity,
                    'metadata': event.metadata
                })
            
            return event_list
            
        except Exception as e:
            logger.error(f"Failed to get recent events: {str(e)}")
            return []
    
    @staticmethod
    def cleanup_old_events(days: int = 30) -> int:
        """
        Clean up events older than specified days.
        
        Args:
            days: Number of days to keep events
            
        Returns:
            Number of events deleted
        """
        try:
            cutoff_date = timezone.now() - timedelta(days=days)
            deleted_count, _ = SurveillanceEvent.objects.filter(
                timestamp__lt=cutoff_date
            ).delete()
            
            logger.info(f"Cleaned up {deleted_count} old events")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup events: {str(e)}")
            return 0


class SettingsService:
    """
    Service for managing system settings and configuration.
    """
    
    @staticmethod
    def get_settings() -> Dict[str, Any]:
        """
        Get current system settings.
        
        Returns:
            Dictionary with system settings
        """
        try:
            settings = SystemSettings.get_settings()
            
            return {
                'appName': settings.app_name,
                'defaultCameraId': str(settings.default_camera_id) if settings.default_camera_id else '',
                'defaultRecordingDurationMinutes': settings.default_recording_duration_minutes,
                'segmentDurationMinutes': settings.segment_duration_minutes,
                'storageLocation': settings.storage_location,
                'retentionPeriodDays': settings.retention_period_days,
                'isAutoRecordingEnabled': settings.is_auto_recording_enabled,
                'isMotionRecordingEnabled': settings.is_motion_recording_enabled,
                'motionSensitivity': settings.motion_sensitivity,
                'enableNotifications': settings.enable_notifications,
                'soundAlerts': settings.sound_alerts,
                'theme': settings.theme,
                'djangoApiUrl': settings.django_api_url,
                'ffmpegHardwareAcc': settings.ffmpeg_hardware_acc,
                'snapshotFormat': settings.snapshot_format,
                'autoCycleIntervalSeconds': settings.auto_cycle_interval_seconds,
                'highStorageAlertThreshold': settings.high_storage_alert_threshold
            }
            
        except Exception as e:
            logger.error(f"Failed to get settings: {str(e)}")
            raise
    
    @staticmethod
    def update_settings(settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update system settings.
        
        Args:
            settings_data: Dictionary with settings to update
            
        Returns:
            Updated settings dictionary
        """
        try:
            settings = SystemSettings.get_settings()
            
            # Map frontend field names to model fields
            field_mapping = {
                'appName': 'app_name',
                'defaultCameraId': 'default_camera_id',
                'defaultRecordingDurationMinutes': 'default_recording_duration_minutes',
                'segmentDurationMinutes': 'segment_duration_minutes',
                'storageLocation': 'storage_location',
                'retentionPeriodDays': 'retention_period_days',
                'isAutoRecordingEnabled': 'is_auto_recording_enabled',
                'isMotionRecordingEnabled': 'is_motion_recording_enabled',
                'motionSensitivity': 'motion_sensitivity',
                'enableNotifications': 'enable_notifications',
                'soundAlerts': 'sound_alerts',
                'theme': 'theme',
                'djangoApiUrl': 'django_api_url',
                'ffmpegHardwareAcc': 'ffmpeg_hardware_acc',
                'snapshotFormat': 'snapshot_format',
                'autoCycleIntervalSeconds': 'auto_cycle_interval_seconds',
                'highStorageAlertThreshold': 'high_storage_alert_threshold'
            }
            
            # Update settings
            for frontend_field, model_field in field_mapping.items():
                if frontend_field in settings_data:
                    setattr(settings, model_field, settings_data[frontend_field])
            
            settings.save()
            
            logger.info("System settings updated")
            
            # Return updated settings
            return SettingsService.get_settings()
            
        except Exception as e:
            logger.error(f"Failed to update settings: {str(e)}")
            raise
    
    @staticmethod
    def reset_to_defaults() -> Dict[str, Any]:
        """
        Reset settings to default values.
        
        Returns:
            Default settings dictionary
        """
        try:
            # Delete existing settings to trigger defaults
            SystemSettings.objects.all().delete()
            
            # Get new default settings
            settings = SystemSettings.get_settings()
            
            logger.info("System settings reset to defaults")
            
            return SettingsService.get_settings()
            
        except Exception as e:
            logger.error(f"Failed to reset settings: {str(e)}")
            raise