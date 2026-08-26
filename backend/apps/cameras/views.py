"""
Camera API views for the surveillance system.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse, Http404
from django.shortcuts import get_object_or_404
import time
import os
from django.utils import timezone
from .models import Camera, CameraSnapshot
from .serializers import (
    CameraSerializer, CameraFormSerializer, ConnectionTestSerializer,
    ConnectionTestResponseSerializer, PTZControlSerializer
)
from .services import RTSPService, ONVIFService, SnapshotService, StreamService
from apps.recordings.services import RecordingService
from apps.system.services import EventService
import logging

logger = logging.getLogger(__name__)


class CameraViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing cameras.
    """
    
    queryset = Camera.objects.all()
    serializer_class = CameraSerializer
    # Disable DRF pagination for this viewset — frontend expects a plain array
    pagination_class = None
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return CameraFormSerializer
        return CameraSerializer
    
    def list(self, request, *args, **kwargs):
        """Return plain list (not paginated dict) to match frontend Camera[] expectation."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Create camera and test connection."""
        camera = serializer.save()
        
        # Test connection after creation
        connection_result = RTSPService.test_connection({
            'ip_address': camera.ip_address,
            'port': camera.port,
            'username': camera.username,
            'password': camera.password,
            'rtsp_stream_path': camera.rtsp_stream_path
        })
        
        if connection_result['success']:
            camera.update_status(Camera.CameraStatus.ONLINE)
            # Update discovered specs if available
            if 'discovered_resolution' in connection_result:
                camera.resolution = connection_result['discovered_resolution']
            if 'discovered_fps' in connection_result:
                camera.fps = connection_result['discovered_fps']
            camera.save()
        else:
            camera.update_status(Camera.CameraStatus.ERROR, connection_result['message'])
        
        # Log event
        EventService.create_event(
            camera_id=camera.id,
            camera_name=camera.name,
            event_type='CAMERA_ONLINE' if connection_result['success'] else 'CAMERA_OFFLINE',
            message=f"Camera {camera.name} {'connected' if connection_result['success'] else 'failed to connect'}: {connection_result['message']}",
            severity='SUCCESS' if connection_result['success'] else 'ERROR'
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(CameraSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
    
    def perform_update(self, serializer):
        """Update camera and retest connection if network settings changed."""
        camera = serializer.save()
        
        # Check if network-related fields were updated
        network_fields = {'ip_address', 'port', 'username', 'password', 'rtsp_stream_path'}
        if network_fields.intersection(set(serializer.validated_data.keys())):
            # Retest connection
            connection_result = RTSPService.test_connection({
                'ip_address': camera.ip_address,
                'port': camera.port,
                'username': camera.username,
                'password': camera.password,
                'rtsp_stream_path': camera.rtsp_stream_path
            })
            
            if connection_result['success']:
                camera.update_status(Camera.CameraStatus.ONLINE)
            else:
                camera.update_status(Camera.CameraStatus.ERROR, connection_result['message'])
    
    @action(detail=False, methods=['post'], url_path='test-connection')
    def test_connection(self, request):
        """
        Test camera connection without creating a camera record.
        """
        serializer = ConnectionTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        camera_data = serializer.validated_data
        result = RTSPService.test_connection(camera_data)
        
        response_serializer = ConnectionTestResponseSerializer(result)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'], url_path='record/start')
    def start_recording(self, request, pk=None):
        camera = self.get_object()
        
        if not camera.is_online:
            return Response(
                {'success': False, 'message': 'Camera is offline'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if camera.is_recording:
            return Response(
                {'success': False, 'message': 'Camera is already recording'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start recording using RecordingService
        result = RecordingService.start_recording(camera)
        
        if result['success']:
            camera.set_recording_state(True)
            EventService.create_event(
                camera_id=camera.id,
                camera_name=camera.name,
                event_type='RECORDING_STARTED',
                message=f'Recording started on {camera.name}',
                severity='SUCCESS'
            )
            # Convert snake_case to camelCase for frontend compatibility
            return Response({
                'success': result['success'],
                'message': result['message'],
                'recordingId': result.get('recording_id'),
                'outputPath': result.get('output_path')
            })
        
        return Response(result)
    
    @action(detail=True, methods=['post'], url_path='record/stop')
    def stop_recording(self, request, pk=None):
        camera = self.get_object()
        
        if not camera.is_recording:
            return Response(
                {'success': False, 'message': 'Camera is not recording'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Stop recording using RecordingService
        result = RecordingService.stop_recording(camera)
        
        if result['success']:
            camera.set_recording_state(False)
            EventService.create_event(
                camera_id=camera.id,
                camera_name=camera.name,
                event_type='RECORDING_STOPPED',
                message=f'Recording stopped on {camera.name}',
                severity='INFO'
            )
            # Convert snake_case to camelCase for frontend compatibility
            return Response({
                'success': result['success'],
                'message': result['message'],
                'recordingId': result.get('recording_id'),
                'durationSeconds': result.get('duration_seconds'),
                'fileSizeMb': result.get('file_size_mb')
            })
        
        return Response(result)
    
    @action(detail=True, methods=['post'], url_path='ptz')
    def ptz_control(self, request, pk=None):
        camera = self.get_object()
        serializer = PTZControlSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        result = ONVIFService.ptz_control(camera, action)
        
        return Response(result)
    
    @action(detail=True, methods=['post'], url_path='snapshot')
    def take_snapshot(self, request, pk=None):
        camera = self.get_object()
        result = SnapshotService.capture_snapshot(camera)
        
        if result['success']:
            EventService.create_event(
                camera_id=camera.id,
                camera_name=camera.name,
                event_type='RECORDING_STARTED',  # Using existing event type
                message=f'Snapshot captured from {camera.name}',
                severity='INFO'
            )
        
        return Response(result)
    
    @action(detail=True, methods=['get'], url_path='stream-info')
    def stream(self, request, pk=None):
        """
        Get camera stream information or start HLS conversion.
        """
        camera = self.get_object()
        
        if not camera.is_online:
            return Response(
                {'error': 'Camera is offline'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get or start HLS stream
        hls_url = StreamService.get_hls_stream_url(camera, request.query_params.get('profile', 'main'))
        
        if hls_url:
            return Response({
                'success': True,
                'hls_url': hls_url,
                'rtsp_url': camera.rtsp_url,
                'status': 'streaming'
            })
        else:
            # Try to start HLS conversion
            if StreamService.start_hls_conversion(camera, request.query_params.get('profile', 'main')):
                return Response({
                    'success': True,
                    'message': 'Starting HLS conversion',
                    'status': 'starting'
                })
            else:
                return Response(
                    {'error': 'Could not start stream'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    @action(detail=True, methods=['get'])
    def health_check(self, request, pk=None):
        """
        Perform health check on camera.
        """
        camera = self.get_object()
        
        # Test current connection
        connection_result = RTSPService.test_connection({
            'ip_address': camera.ip_address,
            'port': camera.port,
            'username': camera.username,
            'password': camera.password,
            'rtsp_stream_path': camera.rtsp_stream_path
        })
        
        # Update camera status based on test
        if connection_result['success']:
            camera.update_status(Camera.CameraStatus.ONLINE)
        else:
            camera.update_status(Camera.CameraStatus.ERROR, connection_result['message'])
        
        return Response({
            'camera_id': camera.id,
            'camera_name': camera.name,
            'status': camera.status,
            'is_online': camera.is_online,
            'last_seen': camera.last_seen,
            'connection_test': connection_result
        })


def hls_playlist(request, camera_id):
    camera = get_object_or_404(Camera, id=camera_id)
    profile = request.GET.get('profile', 'main')
    if not StreamService.start_hls_conversion(camera, profile):
        raise Http404
    playlist_path = StreamService.get_hls_path(camera, 'index.m3u8', profile)
    deadline = time.time() + 8
    while not os.path.isfile(playlist_path) and time.time() < deadline:
        time.sleep(0.2)
    return StreamService.get_hls_file(camera, 'index.m3u8', profile)


def hls_file(request, camera_id, profile, filename):
    camera = get_object_or_404(Camera, id=camera_id)
    return StreamService.get_hls_file(camera, filename, profile)