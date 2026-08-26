"""
Recording API views for the surveillance system.
"""

import os
from django.http import FileResponse, Http404, HttpResponse
from django.db.models import Q, Count, Sum, Avg
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Recording
from .serializers import (
    RecordingSerializer, RecordingFilterSerializer,
    PaginatedRecordingResponseSerializer, RecordingStatsSerializer
)
from .services import RecordingService
from apps.cameras.models import Camera
import logging

logger = logging.getLogger(__name__)


class RecordingPagination(PageNumberPagination):
    """Custom pagination for recordings."""
    page_size = 20
    page_size_query_param = 'pageSize'
    max_page_size = 100


class RecordingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing recordings (read-only, except delete).
    """
    
    queryset = Recording.objects.select_related('camera').all()
    serializer_class = RecordingSerializer
    pagination_class = RecordingPagination
    
    def get_queryset(self):
        """Filter recordings based on query parameters."""
        queryset = self.queryset
        
        # Apply filters from query parameters
        filter_serializer = RecordingFilterSerializer(data=self.request.query_params)
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data
            
            # Date range filters
            if 'date_from' in filters:
                queryset = queryset.filter(start_time__date__gte=filters['date_from'])
            if 'date_to' in filters:
                queryset = queryset.filter(start_time__date__lte=filters['date_to'])
            
            # Time range filters (within a day)
            if 'time_from' in filters:
                queryset = queryset.filter(start_time__time__gte=filters['time_from'])
            if 'time_to' in filters:
                queryset = queryset.filter(start_time__time__lte=filters['time_to'])
            
            # Camera filter
            if 'camera_id' in filters and filters['camera_id'] != 'ALL':
                queryset = queryset.filter(camera_id=filters['camera_id'])
            
            # Trigger type filter
            if 'trigger_type' in filters and filters['trigger_type'] != 'ALL':
                queryset = queryset.filter(trigger_type=filters['trigger_type'])
            
            # Search query (camera name or location)
            if 'search_query' in filters and filters['search_query']:
                search_query = filters['search_query']
                queryset = queryset.filter(
                    Q(camera__name__icontains=search_query) |
                    Q(camera__location__icontains=search_query)
                )
            
            # Sorting
            sort_by = filters.get('sort_by', 'startTime')
            sort_direction = filters.get('sort_direction', 'desc')
            
            sort_field_mapping = {
                'startTime': 'start_time',
                'duration': 'duration_seconds',
                'fileSize': 'file_size_mb',
                'cameraName': 'camera__name'
            }
            
            sort_field = sort_field_mapping.get(sort_by, 'start_time')
            if sort_direction == 'desc':
                sort_field = f'-{sort_field}'
            
            queryset = queryset.order_by(sort_field)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Return paginated recordings in frontend-compatible format: {items, totalCount, page, pageSize, totalPages}."""
        queryset = self.filter_queryset(self.get_queryset())

        # Get pagination params
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('pageSize', 8))
        except (ValueError, TypeError):
            page = 1
            page_size = 8

        page_size = min(max(page_size, 1), 100)
        total_count = queryset.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(max(page, 1), total_pages)

        start = (page - 1) * page_size
        end = start + page_size
        page_queryset = queryset[start:end]

        serializer = self.get_serializer(page_queryset, many=True)
        return Response({
            'items': serializer.data,
            'totalCount': total_count,
            'page': page,
            'pageSize': page_size,
            'totalPages': total_pages
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete recording and associated file."""
        recording = self.get_object()
        
        # Don't allow deletion of active recordings
        if recording.is_active:
            return Response(
                {'success': False, 'error': 'Cannot delete active recording'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store info before deletion
        file_path = recording.storage_file_path
        recording_name = f"{recording.camera.name} - {recording.start_time}"
        
        # Delete file from disk
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted recording file: {file_path}")
            except OSError as e:
                logger.error(f"Failed to delete recording file {file_path}: {str(e)}")
                return Response(
                    {'success': False, 'message': f'Failed to delete file: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Delete database record
        recording.delete()
        
        return Response(
            {'success': True, 'message': f'Recording "{recording_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def video(self, request, pk=None):
        """
        Stream or download recording video file.
        """
        recording = self.get_object()
        
        if not recording.storage_file_path or not os.path.exists(recording.storage_file_path):
            raise Http404("Video file not found")
        
        # Check if request wants to download the file
        if request.query_params.get('download') == 'true':
            response = FileResponse(
                open(recording.storage_file_path, 'rb'),
                as_attachment=True,
                filename=recording.filename
            )
            response['Content-Type'] = 'video/mp4'
            return response
        
        # Stream video for playback
        response = FileResponse(
            open(recording.storage_file_path, 'rb'),
            content_type='video/mp4'
        )
        response['Accept-Ranges'] = 'bytes'
        return response
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get recording statistics and analytics.
        """
        try:
            # Basic statistics
            total_recordings = Recording.objects.count()
            total_size_gb = Recording.objects.aggregate(
                total_size=Sum('file_size_mb')
            )['total_size'] or 0
            total_size_gb = total_size_gb / 1024  # Convert MB to GB
            
            avg_duration_minutes = Recording.objects.aggregate(
                avg_duration=Avg('duration_seconds')
            )['avg_duration'] or 0
            avg_duration_minutes = avg_duration_minutes / 60  # Convert to minutes
            
            # Recordings by trigger type
            recordings_by_trigger = Recording.objects.values('trigger_type').annotate(
                count=Count('id')
            )
            recordings_by_trigger_type = {
                item['trigger_type']: item['count'] 
                for item in recordings_by_trigger
            }
            
            # Recordings by camera
            recordings_by_camera_query = Recording.objects.select_related('camera').values(
                'camera__name'
            ).annotate(count=Count('id'))
            recordings_by_camera = {
                item['camera__name']: item['count'] 
                for item in recordings_by_camera_query
            }
            
            # Recent activity (last 10 recordings)
            recent_recordings = Recording.objects.select_related('camera').order_by('-start_time')[:10]
            recent_activity = [
                {
                    'id': str(rec.id),
                    'camera_name': rec.camera.name,
                    'start_time': rec.start_time.isoformat(),
                    'duration_seconds': rec.duration_seconds,
                    'trigger_type': rec.trigger_type,
                    'status': rec.status
                }
                for rec in recent_recordings
            ]
            
            stats_data = {
                'total_recordings': total_recordings,
                'total_size_gb': round(total_size_gb, 2),
                'average_duration_minutes': round(avg_duration_minutes, 1),
                'recordings_by_trigger_type': recordings_by_trigger_type,
                'recordings_by_camera': recordings_by_camera,
                'recent_activity': recent_activity
            }
            
            serializer = RecordingStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Failed to get recording stats: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get currently active recordings.
        """
        active_recordings = RecordingService.get_active_recordings()
        return Response({
            'active_recordings': active_recordings,
            'count': len(active_recordings)
        })
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """
        Clean up old recordings based on retention policy.
        """
        retention_days = request.data.get('retention_days')
        
        if not retention_days:
            return Response(
                {'error': 'retention_days is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            retention_days = int(retention_days)
        except (ValueError, TypeError):
            return Response(
                {'error': 'retention_days must be a number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = RecordingService.cleanup_old_recordings(retention_days)
        return Response(result)