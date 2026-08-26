"""
Camera models for the surveillance system.
"""

from django.db import models
from django.utils import timezone
import uuid


class Camera(models.Model):
    """
    Model representing a Tapo TC40 or compatible IP camera.
    """
    
    class CameraStatus(models.TextChoices):
        ONLINE = 'ONLINE', 'Online'
        OFFLINE = 'OFFLINE', 'Offline'
        CONNECTING = 'CONNECTING', 'Connecting'
        ERROR = 'ERROR', 'Error'
    
    # Core identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="Human-friendly camera name")
    
    # Network configuration
    ip_address = models.GenericIPAddressField(help_text="Camera IP address")
    port = models.PositiveIntegerField(default=554, help_text="RTSP port")
    onvif_port = models.PositiveIntegerField(default=2020, null=True, blank=True, help_text="ONVIF port for PTZ control")
    username = models.CharField(max_length=50, help_text="Camera authentication username")
    password = models.CharField(max_length=100, help_text="Camera authentication password")
    
    # RTSP stream paths
    rtsp_stream_path = models.CharField(max_length=200, default="/stream1", help_text="Main stream path (e.g., /stream1)")
    sub_stream_path = models.CharField(max_length=200, default="/stream2", help_text="Sub stream path (e.g., /stream2)")
    
    # Status and configuration
    status = models.CharField(max_length=20, choices=CameraStatus.choices, default=CameraStatus.OFFLINE)
    is_recording = models.BooleanField(default=False, help_text="Currently recording")
    is_enabled = models.BooleanField(default=True, help_text="Camera is enabled for monitoring")
    recording_enabled = models.BooleanField(default=True, help_text="Recording is enabled for this camera")
    
    # Video specifications
    resolution = models.CharField(max_length=50, default="1920x1080", help_text="Current video resolution")
    fps = models.PositiveIntegerField(default=25, help_text="Frames per second")
    bitrate_kbps = models.PositiveIntegerField(default=2048, help_text="Video bitrate in kbps")
    
    # Hardware information
    model = models.CharField(max_length=100, default="Tapo TC40 Outdoor Pan/Tilt", help_text="Camera model")
    location = models.CharField(max_length=200, help_text="Physical location description")
    mac_address = models.CharField(max_length=17, null=True, blank=True, help_text="MAC address")
    firmware_version = models.CharField(max_length=100, null=True, blank=True, help_text="Camera firmware version")
    
    # PTZ capabilities
    pan_tilt_supported = models.BooleanField(default=True, help_text="Camera supports pan/tilt control")
    ptz_current_pan = models.FloatField(default=0.0, help_text="Current pan position")
    ptz_current_tilt = models.FloatField(default=0.0, help_text="Current tilt position")
    
    # Monitoring
    last_seen = models.DateTimeField(auto_now=True, help_text="Last successful communication")
    error_reason = models.TextField(null=True, blank=True, help_text="Last error message")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Camera"
        verbose_name_plural = "Cameras"
    
    def __str__(self):
        return f"{self.name} ({self.ip_address})"
    
    @property
    def rtsp_url(self):
        """
        Generate the main RTSP stream URL in Tapo format.
        Tapo cameras use: rtsp://username:password@IP_ADDRESS/stream1
        Port 554 is default and omitted per Tapo official spec.
        """
        if self.port and self.port != 554:
            # Non-standard port — include it explicitly
            return f"rtsp://{self.username}:{self.password}@{self.ip_address}:{self.port}{self.rtsp_stream_path}"
        # Standard port 554 — Tapo official format omits port
        return f"rtsp://{self.username}:{self.password}@{self.ip_address}{self.rtsp_stream_path}"

    @property
    def rtsp_sub_url(self):
        """
        Generate the sub stream URL in Tapo format.
        stream2 = standard quality (360p).
        """
        if self.port and self.port != 554:
            return f"rtsp://{self.username}:{self.password}@{self.ip_address}:{self.port}{self.sub_stream_path}"
        return f"rtsp://{self.username}:{self.password}@{self.ip_address}{self.sub_stream_path}"
    
    @property
    def onvif_url(self):
        """Generate the ONVIF service URL."""
        if self.onvif_port:
            return f"http://{self.ip_address}:{self.onvif_port}/onvif/device_service"
        return None
    
    @property
    def is_online(self):
        """Check if camera is considered online."""
        return self.status == self.CameraStatus.ONLINE
    
    @property
    def ptz_position(self):
        """Get current PTZ position as dict."""
        return {
            'pan': self.ptz_current_pan,
            'tilt': self.ptz_current_tilt
        }
    
    def update_status(self, status, error_reason=None):
        """Update camera status and error reason."""
        self.status = status
        self.error_reason = error_reason
        self.last_seen = timezone.now()
        self.save(update_fields=['status', 'error_reason', 'last_seen'])
    
    def set_recording_state(self, is_recording):
        """Update recording state."""
        self.is_recording = is_recording
        self.save(update_fields=['is_recording'])
    
    def update_ptz_position(self, pan=None, tilt=None):
        """Update PTZ position."""
        if pan is not None:
            self.ptz_current_pan = pan
        if tilt is not None:
            self.ptz_current_tilt = tilt
        self.save(update_fields=['ptz_current_pan', 'ptz_current_tilt'])


class CameraSnapshot(models.Model):
    """
    Model for storing camera snapshot metadata.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='snapshots')
    filename = models.CharField(max_length=255, help_text="Snapshot filename")
    file_path = models.CharField(max_length=500, help_text="Full file path")
    file_size_bytes = models.PositiveBigIntegerField(help_text="File size in bytes")
    width = models.PositiveIntegerField(help_text="Image width in pixels")
    height = models.PositiveIntegerField(help_text="Image height in pixels")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Camera Snapshot"
        verbose_name_plural = "Camera Snapshots"
    
    def __str__(self):
        return f"Snapshot of {self.camera.name} - {self.created_at}"