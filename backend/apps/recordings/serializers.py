"""
Serializers for recording API endpoints.
"""

from rest_framework import serializers
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from .models import Recording, RecordingSegment


class RecordingSerializer(serializers.ModelSerializer):
    """
    Serializer for Recording model with computed fields for frontend compatibility.
    """
    
    # Computed fields for frontend compatibility
    cameraId = serializers.SerializerMethodField()
    cameraName = serializers.SerializerMethodField()
    cameraLocation = serializers.SerializerMethodField()
    startTime = serializers.SerializerMethodField()
    endTime = serializers.SerializerMethodField()
    durationSeconds = serializers.SerializerMethodField()
    fileSizeMB = serializers.SerializerMethodField()
    triggerType = serializers.SerializerMethodField()
    videoUrl = serializers.SerializerMethodField()
    thumbnailUrl = serializers.SerializerMethodField()
    storageFilePath = serializers.SerializerMethodField()
    bitrateKbps = serializers.SerializerMethodField()
    fileAvailable = serializers.SerializerMethodField()
    
    class Meta:
        model = Recording
        fields = [
            'id', 'cameraId', 'cameraName', 'cameraLocation',
            'startTime', 'endTime', 'durationSeconds', 'fileSizeMB',
            'status', 'triggerType', 'videoUrl', 'thumbnailUrl',
            'storageFilePath', 'resolution', 'fps', 'bitrateKbps', 'fileAvailable'
        ]
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_cameraId(self, obj) -> str:
        return str(obj.camera.id)
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_cameraName(self, obj) -> str:
        return obj.camera.name
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_cameraLocation(self, obj) -> str:
        return obj.camera.location
    
    @extend_schema_field(OpenApiTypes.DATETIME)
    def get_startTime(self, obj):
        return obj.start_time.isoformat() if obj.start_time else None
    
    @extend_schema_field(OpenApiTypes.DATETIME)
    def get_endTime(self, obj):
        return obj.end_time.isoformat() if obj.end_time else None
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_durationSeconds(self, obj):
        return obj.duration_seconds
    
    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_fileSizeMB(self, obj):
        return obj.file_size_mb
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_triggerType(self, obj):
        return obj.trigger_type
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_videoUrl(self, obj) -> str:
        return obj.video_url or f'/api/recordings/{obj.id}/video/'
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_thumbnailUrl(self, obj):
        return obj.thumbnail_url
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_storageFilePath(self, obj):
        return obj.storage_file_path
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_bitrateKbps(self, obj):
        return obj.bitrate_kbps

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_fileAvailable(self, obj) -> bool:
        import os
        return bool(obj.storage_file_path and os.path.isfile(obj.storage_file_path))


class RecordingFilterSerializer(serializers.Serializer):
    """
    Serializer for recording filter parameters.
    """
    
    dateFrom = serializers.DateField(source='date_from', required=False)
    dateTo = serializers.DateField(source='date_to', required=False)
    timeFrom = serializers.TimeField(source='time_from', required=False)
    timeTo = serializers.TimeField(source='time_to', required=False)
    cameraId = serializers.CharField(source='camera_id', required=False)
    triggerType = serializers.ChoiceField(
        source='trigger_type',
        choices=[('ALL', 'All')] + list(Recording.TriggerType.choices),
        required=False
    )
    sortBy = serializers.ChoiceField(
        source='sort_by',
        choices=[
            ('startTime', 'Start Time'),
            ('duration', 'Duration'),
            ('fileSize', 'File Size'),
            ('cameraName', 'Camera Name')
        ],
        default='startTime'
    )
    sortDirection = serializers.ChoiceField(
        source='sort_direction',
        choices=[('asc', 'Ascending'), ('desc', 'Descending')],
        default='desc'
    )
    page = serializers.IntegerField(min_value=1, default=1)
    pageSize = serializers.IntegerField(source='page_size', min_value=1, max_value=100, default=20)
    searchQuery = serializers.CharField(source='search_query', required=False, allow_blank=True)


class PaginatedRecordingResponseSerializer(serializers.Serializer):
    """
    Serializer for paginated recording response.
    """
    
    items = RecordingSerializer(many=True)
    totalCount = serializers.IntegerField(source='total_count')
    page = serializers.IntegerField()
    pageSize = serializers.IntegerField(source='page_size')
    totalPages = serializers.IntegerField(source='total_pages')


class RecordingSegmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Recording Segment model.
    """
    
    class Meta:
        model = RecordingSegment
        fields = [
            'id', 'recording', 'segment_number', 'start_time', 'end_time',
            'file_path', 'file_size_bytes', 'duration_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RecordingStatsSerializer(serializers.Serializer):
    """
    Serializer for recording statistics.
    """
    
    totalRecordings = serializers.IntegerField(source='total_recordings')
    totalSizeGB = serializers.FloatField(source='total_size_gb')
    averageDurationMinutes = serializers.FloatField(source='average_duration_minutes')
    recordingsByTriggerType = serializers.DictField(source='recordings_by_trigger_type')
    recordingsByCamera = serializers.DictField(source='recordings_by_camera')
    recentActivity = serializers.ListField(source='recent_activity')