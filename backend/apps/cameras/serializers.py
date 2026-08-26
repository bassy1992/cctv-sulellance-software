"""
Serializers for camera API endpoints.
"""

from rest_framework import serializers
from .models import Camera, CameraSnapshot


class CameraSerializer(serializers.ModelSerializer):
    """
    Serializer for Camera model with computed fields for frontend compatibility.
    """
    
    # Computed fields for frontend compatibility
    hasPassword = serializers.SerializerMethodField()
    liveHlsUrl = serializers.SerializerMethodField()
    ptzCurrentPosition = serializers.SerializerMethodField()
    
    class Meta:
        model = Camera
        fields = [
            'id', 'name', 'ip_address', 'port', 'onvif_port',
            'username', 'hasPassword', 'rtsp_stream_path', 'sub_stream_path',
            'status', 'is_recording', 'is_enabled', 'recording_enabled',
            'resolution', 'fps', 'bitrate_kbps', 'model', 'location',
            'pan_tilt_supported', 'ptzCurrentPosition', 'last_seen',
            'error_reason', 'mac_address', 'firmware_version', 'liveHlsUrl'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'last_seen': {'read_only': True},
        }
    
    def get_hasPassword(self, obj):
        """Check if camera has a password set."""
        return bool(obj.password)
    
    def get_liveHlsUrl(self, obj):
        """Generate HLS stream URL for live viewing."""
        return f'/cameras/{obj.id}/stream.m3u8'
    
    def get_ptzCurrentPosition(self, obj):
        """Get current PTZ position."""
        return obj.ptz_position
    
    def to_representation(self, instance):
        """
        Convert field names to match frontend expectations.
        """
        ret = super().to_representation(instance)
        
        # Map Django field names to frontend field names
        field_mapping = {
            'ip_address': 'ipAddress',
            'onvif_port': 'onvifPort',
            'rtsp_stream_path': 'rtspStreamPath',
            'sub_stream_path': 'subStreamPath',
            'is_recording': 'isRecording',
            'is_enabled': 'isEnabled',
            'recording_enabled': 'recordingEnabled',
            'bitrate_kbps': 'bitrateKbps',
            'pan_tilt_supported': 'panTiltSupported',
            'last_seen': 'lastSeen',
            'error_reason': 'errorReason',
            'mac_address': 'macAddress',
            'firmware_version': 'firmwareVersion',
        }
        
        for django_field, frontend_field in field_mapping.items():
            if django_field in ret:
                ret[frontend_field] = ret.pop(django_field)
        
        return ret


class CameraFormSerializer(serializers.ModelSerializer):
    """
    Serializer for camera form data (create/update operations).
    """
    
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Camera
        fields = [
            'name', 'ip_address', 'port', 'onvif_port', 'username', 'password',
            'rtsp_stream_path', 'sub_stream_path', 'location', 'recording_enabled',
            'pan_tilt_supported'
        ]
    
    def to_internal_value(self, data):
        """
        Convert frontend field names to Django field names.
        """
        field_mapping = {
            'ipAddress': 'ip_address',
            'onvifPort': 'onvif_port',
            'rtspStreamPath': 'rtsp_stream_path',
            'subStreamPath': 'sub_stream_path',
            'recordingEnabled': 'recording_enabled',
            'panTiltSupported': 'pan_tilt_supported',
        }
        
        # Create a mutable copy of the data
        converted_data = {}
        for key, value in data.items():
            new_key = field_mapping.get(key, key)
            converted_data[new_key] = value
        
        return super().to_internal_value(converted_data)

    def update(self, instance, validated_data):
        if not validated_data.get('password'):
            validated_data.pop('password', None)
        return super().update(instance, validated_data)


class ConnectionTestSerializer(serializers.Serializer):
    """
    Serializer for camera connection test requests.
    """
    
    ip_address = serializers.IPAddressField()
    port = serializers.IntegerField(default=554)
    onvif_port = serializers.IntegerField(required=False, allow_null=True)
    username = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True)
    rtsp_stream_path = serializers.CharField(default='/stream1')
    sub_stream_path = serializers.CharField(default='/stream2')

    def to_internal_value(self, data):
        field_mapping = {
            'ipAddress': 'ip_address',
            'onvifPort': 'onvif_port',
            'rtspStreamPath': 'rtsp_stream_path',
            'subStreamPath': 'sub_stream_path',
        }
        converted_data = {
            field_mapping.get(key, key): value
            for key, value in data.items()
        }
        if isinstance(converted_data.get('ip_address'), str):
            converted_data['ip_address'] = converted_data['ip_address'].strip()
        return super().to_internal_value(converted_data)


class ConnectionTestResponseSerializer(serializers.Serializer):
    """
    Serializer for connection test response.
    """
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    latencyMs = serializers.IntegerField(source='latency_ms', required=False)
    discoveredResolution = serializers.CharField(source='discovered_resolution', required=False)
    discoveredFps = serializers.IntegerField(source='discovered_fps', required=False)
    rtspUrlChecked = serializers.CharField(source='rtsp_url_checked', required=False)
    details = serializers.DictField(required=False)


class PTZControlSerializer(serializers.Serializer):
    """
    Serializer for PTZ control commands.
    """
    
    action = serializers.ChoiceField(choices=[
        'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'preset_home', 'stop'
    ])


class CameraSnapshotSerializer(serializers.ModelSerializer):
    """
    Serializer for camera snapshots.
    """
    
    class Meta:
        model = CameraSnapshot
        fields = [
            'id', 'camera', 'filename', 'file_path', 'file_size_bytes',
            'width', 'height', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']