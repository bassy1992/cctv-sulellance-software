"""
Django admin configuration for recordings app.
"""

from django.contrib import admin
from .models import Recording, RecordingSegment


@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    """
    Admin interface for Recording model.
    """
    
    list_display = [
        'camera', 'start_time', 'end_time', 'duration_formatted',
        'file_size_mb', 'status', 'trigger_type', 'resolution'
    ]
    list_filter = ['status', 'trigger_type', 'camera', 'start_time']
    search_fields = ['camera__name', 'storage_file_path']
    readonly_fields = ['id', 'created_at', 'updated_at', 'duration_formatted']
    date_hierarchy = 'start_time'
    
    fieldsets = (
        ('Recording Information', {
            'fields': ('id', 'camera', 'status', 'trigger_type')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration_seconds', 'duration_formatted')
        }),
        ('File Details', {
            'fields': ('storage_file_path', 'file_size_mb', 'video_url', 'thumbnail_url')
        }),
        ('Video Specifications', {
            'fields': ('resolution', 'fps', 'bitrate_kbps')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def duration_formatted(self, obj):
        return obj.duration_formatted
    duration_formatted.short_description = 'Duration'


@admin.register(RecordingSegment)
class RecordingSegmentAdmin(admin.ModelAdmin):
    """
    Admin interface for RecordingSegment model.
    """
    
    list_display = [
        'recording', 'segment_number', 'start_time', 'end_time',
        'duration_seconds', 'file_size_bytes'
    ]
    list_filter = ['recording__camera', 'start_time']
    search_fields = ['recording__camera__name', 'file_path']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Segment Information', {
            'fields': ('id', 'recording', 'segment_number')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration_seconds')
        }),
        ('File Details', {
            'fields': ('file_path', 'file_size_bytes')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )