"""
Django admin configuration for system app.
"""

from django.contrib import admin
from .models import SystemSettings, SurveillanceEvent, SystemHealth


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """
    Admin interface for SystemSettings model.
    """
    
    fieldsets = (
        ('Application Settings', {
            'fields': ('app_name', 'default_camera_id', 'theme')
        }),
        ('Recording Configuration', {
            'fields': (
                'default_recording_duration_minutes', 'segment_duration_minutes',
                'storage_location', 'retention_period_days'
            )
        }),
        ('Automation Settings', {
            'fields': (
                'is_auto_recording_enabled', 'is_motion_recording_enabled',
                'motion_sensitivity'
            )
        }),
        ('Notification Settings', {
            'fields': ('enable_notifications', 'sound_alerts')
        }),
        ('UI Settings', {
            'fields': ('auto_cycle_interval_seconds',)
        }),
        ('Backend Configuration', {
            'fields': (
                'django_api_url', 'ffmpeg_hardware_acc', 'snapshot_format',
                'high_storage_alert_threshold'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False
    
    def has_add_permission(self, request):
        # Only allow one settings instance
        return not SystemSettings.objects.exists()


@admin.register(SurveillanceEvent)
class SurveillanceEventAdmin(admin.ModelAdmin):
    """
    Admin interface for SurveillanceEvent model.
    """
    
    list_display = [
        'timestamp', 'camera_name', 'event_type', 'severity', 'message'
    ]
    list_filter = ['event_type', 'severity', 'timestamp', 'camera_name']
    search_fields = ['camera_name', 'message', 'camera_id']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'timestamp', 'event_type', 'severity')
        }),
        ('Camera Details', {
            'fields': ('camera_id', 'camera_name')
        }),
        ('Event Details', {
            'fields': ('message', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    actions = ['mark_as_resolved']
    
    def mark_as_resolved(self, request, queryset):
        """Custom action to mark events as resolved."""
        count = 0
        for event in queryset:
            if 'resolved' not in event.metadata:
                event.metadata['resolved'] = True
                event.save()
                count += 1
        
        self.message_user(request, f'{count} events marked as resolved.')
    mark_as_resolved.short_description = "Mark selected events as resolved"


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    """
    Admin interface for SystemHealth model.
    """
    
    list_display = [
        'updated_at', 'backend_status', 'total_cameras', 'online_cameras',
        'active_recordings_count', 'cpu_usage_percent', 'ram_usage_percent'
    ]
    list_filter = ['backend_status', 'updated_at']
    readonly_fields = [
        'created_at', 'updated_at', 'last_sync_time'
    ]
    
    fieldsets = (
        ('Backend Status', {
            'fields': ('backend_status', 'django_endpoint', 'last_sync_time')
        }),
        ('Camera Metrics', {
            'fields': (
                'total_cameras', 'online_cameras', 'offline_cameras',
                'active_recordings_count'
            )
        }),
        ('System Metrics', {
            'fields': (
                'cpu_usage_percent', 'ram_usage_percent',
                'ffmpeg_running_instances', 'system_uptime_seconds'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one health record
        return not SystemHealth.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of health record
        return False