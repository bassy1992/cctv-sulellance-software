"""
Django admin configuration for cameras app.
"""

from django.contrib import admin
from .models import Camera, CameraSnapshot


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    """
    Admin interface for Camera model.
    """
    
    list_display = [
        'name', 'ip_address', 'status', 'is_recording', 'is_enabled',
        'location', 'model', 'last_seen'
    ]
    list_filter = ['status', 'is_recording', 'is_enabled', 'model', 'pan_tilt_supported']
    search_fields = ['name', 'ip_address', 'location', 'mac_address']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_seen']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'location', 'model')
        }),
        ('Network Configuration', {
            'fields': (
                'ip_address', 'port', 'onvif_port', 'username', 'password',
                'rtsp_stream_path', 'sub_stream_path'
            )
        }),
        ('Status & Control', {
            'fields': (
                'status', 'is_enabled', 'is_recording', 'recording_enabled',
                'error_reason', 'last_seen'
            )
        }),
        ('Video Specifications', {
            'fields': ('resolution', 'fps', 'bitrate_kbps')
        }),
        ('PTZ Configuration', {
            'fields': (
                'pan_tilt_supported', 'ptz_current_pan', 'ptz_current_tilt'
            )
        }),
        ('Hardware Information', {
            'fields': ('mac_address', 'firmware_version')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CameraSnapshot)
class CameraSnapshotAdmin(admin.ModelAdmin):
    """
    Admin interface for CameraSnapshot model.
    """
    
    list_display = ['camera', 'filename', 'file_size_bytes', 'width', 'height', 'created_at']
    list_filter = ['created_at', 'camera']
    search_fields = ['camera__name', 'filename']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Snapshot Information', {
            'fields': ('id', 'camera', 'filename', 'file_path', 'created_at')
        }),
        ('File Details', {
            'fields': ('file_size_bytes', 'width', 'height')
        }),
    )