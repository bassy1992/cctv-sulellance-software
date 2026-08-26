"""
Recording models for the surveillance system.
"""

from django.db import models
from django.utils import timezone
from apps.cameras.models import Camera
import uuid
import os


class Recording(models.Model):
    """
    Model representing a video recording from a camera.
    """
    
    class RecordingStatus(models.TextChoices):
        COMPLETED = 'COMPLETED', 'Completed'
        RECORDING = 'RECORDING', 'Recording'
        FAILED = 'FAILED', 'Failed'
    
    class TriggerType(models.TextChoices):
        MANUAL = 'MANUAL', 'Manual'
        MOTION = 'MOTION', 'Motion Detection'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        CONTINUOUS = 'CONTINUOUS', 'Continuous'
    
    # Core identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='recordings')
    
    # Recording metadata
    start_time = models.DateTimeField(help_text="Recording start timestamp")
    end_time = models.DateTimeField(null=True, blank=True, help_text="Recording end timestamp")
    duration_seconds = models.PositiveIntegerField(default=0, help_text="Recording duration in seconds")
    
    # File information
    file_size_mb = models.FloatField(default=0.0, help_text="File size in megabytes")
    storage_file_path = models.CharField(max_length=500, help_text="Full path to video file")
    video_url = models.URLField(max_length=500, blank=True, help_text="URL for video playback")
    thumbnail_url = models.URLField(max_length=500, blank=True, help_text="URL for video thumbnail")
    
    # Status and configuration
    status = models.CharField(max_length=20, choices=RecordingStatus.choices, default=RecordingStatus.RECORDING)
    trigger_type = models.CharField(max_length=20, choices=TriggerType.choices, default=TriggerType.MANUAL)
    
    # Video specifications (copied from camera at recording time)
    resolution = models.CharField(max_length=50, help_text="Video resolution")
    fps = models.PositiveIntegerField(help_text="Frames per second")
    bitrate_kbps = models.PositiveIntegerField(help_text="Video bitrate in kbps")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_time']
        verbose_name = "Recording"
        verbose_name_plural = "Recordings"
        indexes = [
            models.Index(fields=['camera', '-start_time']),
            models.Index(fields=['status']),
            models.Index(fields=['trigger_type']),
            models.Index(fields=['-start_time']),
        ]
    
    def __str__(self):
        return f"Recording {self.camera.name} - {self.start_time}"
    
    @property
    def camera_name(self):
        """Get camera name."""
        return self.camera.name
    
    @property
    def camera_location(self):
        """Get camera location."""
        return self.camera.location
    
    @property
    def filename(self):
        """Get filename from storage path."""
        if self.storage_file_path:
            return os.path.basename(self.storage_file_path)
        return ''
    
    @property
    def is_active(self):
        """Check if recording is currently active."""
        return self.status == self.RecordingStatus.RECORDING
    
    @property
    def duration_formatted(self):
        """Get formatted duration string."""
        if self.duration_seconds == 0:
            return "0s"
        
        hours = self.duration_seconds // 3600
        minutes = (self.duration_seconds % 3600) // 60
        seconds = self.duration_seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def calculate_duration(self):
        """Calculate and update duration from start and end times."""
        if self.end_time and self.start_time:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
            self.save(update_fields=['duration_seconds'])
    
    def update_file_size(self):
        """Update file size from actual file on disk."""
        if self.storage_file_path and os.path.exists(self.storage_file_path):
            size_bytes = os.path.getsize(self.storage_file_path)
            self.file_size_mb = size_bytes / (1024 * 1024)
            self.save(update_fields=['file_size_mb'])
    
    def complete_recording(self, end_time=None):
        """Mark recording as completed and update metadata."""
        if end_time is None:
            end_time = timezone.now()
        
        self.end_time = end_time
        self.status = self.RecordingStatus.COMPLETED
        self.calculate_duration()
        self.update_file_size()
        
        # Update video URL for playback
        self.video_url = f'/api/recordings/{self.id}/video/'
        
        self.save(update_fields=['end_time', 'status', 'video_url'])
    
    def mark_failed(self, error_reason=None):
        """Mark recording as failed."""
        self.status = self.RecordingStatus.FAILED
        self.end_time = timezone.now()
        self.save(update_fields=['status', 'end_time'])


class RecordingSegment(models.Model):
    """
    Model for recording segments (when recordings are split into chunks).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recording = models.ForeignKey(Recording, on_delete=models.CASCADE, related_name='segments')
    segment_number = models.PositiveIntegerField(help_text="Segment sequence number")
    start_time = models.DateTimeField(help_text="Segment start timestamp")
    end_time = models.DateTimeField(help_text="Segment end timestamp")
    file_path = models.CharField(max_length=500, help_text="Path to segment file")
    file_size_bytes = models.PositiveBigIntegerField(default=0, help_text="Segment file size")
    duration_seconds = models.PositiveIntegerField(default=0, help_text="Segment duration")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['recording', 'segment_number']
        unique_together = ['recording', 'segment_number']
        verbose_name = "Recording Segment"
        verbose_name_plural = "Recording Segments"
    
    def __str__(self):
        return f"Segment {self.segment_number} of {self.recording}"