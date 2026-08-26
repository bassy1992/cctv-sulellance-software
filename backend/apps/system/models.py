"""
System models for surveillance system configuration and events.
"""

from django.db import models
from django.utils import timezone
import uuid


class SystemSettings(models.Model):
    """
    Model for storing system-wide configuration settings.
    """
    
    class MotionSensitivity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
    
    class Theme(models.TextChoices):
        DARK = 'dark', 'Dark'
        LIGHT = 'light', 'Light'
    
    class HardwareAcceleration(models.TextChoices):
        AUTO = 'auto', 'Auto'
        NVENC = 'nvenc', 'NVIDIA NVENC'
        QSV = 'qsv', 'Intel Quick Sync'
        CPU = 'cpu', 'CPU Only'
    
    class SnapshotFormat(models.TextChoices):
        JPEG = 'jpeg', 'JPEG'
        PNG = 'png', 'PNG'
    
    # Application settings
    app_name = models.CharField(max_length=100, default='Tapo Surveillance VMS')
    default_camera_id = models.UUIDField(null=True, blank=True)
    
    # Recording settings
    default_recording_duration_minutes = models.PositiveIntegerField(default=15)
    segment_duration_minutes = models.PositiveIntegerField(default=30)
    storage_location = models.CharField(max_length=500, default=r'C:\Users\Comme\Videos')
    retention_period_days = models.PositiveIntegerField(default=14)
    
    # Automation settings
    is_auto_recording_enabled = models.BooleanField(default=True)
    is_motion_recording_enabled = models.BooleanField(default=True)
    motion_sensitivity = models.CharField(
        max_length=10,
        choices=MotionSensitivity.choices,
        default=MotionSensitivity.MEDIUM
    )
    
    # Notification settings
    enable_notifications = models.BooleanField(default=True)
    sound_alerts = models.BooleanField(default=False)
    
    # UI settings
    theme = models.CharField(max_length=10, choices=Theme.choices, default=Theme.DARK)
    auto_cycle_interval_seconds = models.PositiveIntegerField(default=10)
    
    # Backend settings
    django_api_url = models.URLField(default='http://127.0.0.1:8000/api')
    ffmpeg_hardware_acc = models.CharField(
        max_length=10,
        choices=HardwareAcceleration.choices,
        default=HardwareAcceleration.AUTO
    )
    snapshot_format = models.CharField(
        max_length=10,
        choices=SnapshotFormat.choices,
        default=SnapshotFormat.JPEG
    )
    high_storage_alert_threshold = models.PositiveIntegerField(default=85)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"
    
    def __str__(self):
        return f"System Settings - {self.app_name}"
    
    @classmethod
    def get_settings(cls):
        """Get or create system settings singleton."""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


class SurveillanceEvent(models.Model):
    """
    Model for storing system events and alerts.
    """
    
    class EventType(models.TextChoices):
        MOTION_DETECTED = 'MOTION_DETECTED', 'Motion Detected'
        RECORDING_STARTED = 'RECORDING_STARTED', 'Recording Started'
        RECORDING_STOPPED = 'RECORDING_STOPPED', 'Recording Stopped'
        CAMERA_OFFLINE = 'CAMERA_OFFLINE', 'Camera Offline'
        CAMERA_ONLINE = 'CAMERA_ONLINE', 'Camera Online'
        STORAGE_WARNING = 'STORAGE_WARNING', 'Storage Warning'
    
    class Severity(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        SUCCESS = 'SUCCESS', 'Success'
    
    # Core identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Event details
    timestamp = models.DateTimeField(default=timezone.now)
    camera_id = models.UUIDField(null=True, blank=True)
    camera_name = models.CharField(max_length=100, blank=True)
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.INFO)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Surveillance Event"
        verbose_name_plural = "Surveillance Events"
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['camera_id', '-timestamp']),
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.camera_name} - {self.timestamp}"


class SystemHealth(models.Model):
    """
    Model for storing system health metrics.
    """
    
    class BackendStatus(models.TextChoices):
        CONNECTED = 'CONNECTED', 'Connected'
        DISCONNECTED = 'DISCONNECTED', 'Disconnected'
        DEGRADED = 'DEGRADED', 'Degraded'
    
    # Backend status
    backend_status = models.CharField(
        max_length=20,
        choices=BackendStatus.choices,
        default=BackendStatus.CONNECTED
    )
    django_endpoint = models.URLField(default='http://127.0.0.1:8000/api')
    
    # Camera metrics
    active_recordings_count = models.PositiveIntegerField(default=0)
    total_cameras = models.PositiveIntegerField(default=0)
    online_cameras = models.PositiveIntegerField(default=0)
    offline_cameras = models.PositiveIntegerField(default=0)
    
    # System metrics
    cpu_usage_percent = models.FloatField(default=0.0)
    ram_usage_percent = models.FloatField(default=0.0)
    ffmpeg_running_instances = models.PositiveIntegerField(default=0)
    system_uptime_seconds = models.PositiveBigIntegerField(default=0)
    
    # Timestamps
    last_sync_time = models.CharField(max_length=50, default='Just now')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "System Health"
        verbose_name_plural = "System Health"
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"System Health - {self.backend_status} - {self.updated_at}"
    
    @classmethod
    def get_current_health(cls):
        """Get or create current system health record."""
        health, created = cls.objects.get_or_create(pk=1)
        return health