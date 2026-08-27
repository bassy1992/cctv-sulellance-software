"""
System API views for health monitoring, events, and settings.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers, status
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from .services import SystemHealthService, EventService, SettingsService
import logging

logger = logging.getLogger(__name__)


class SystemSettingsInputSerializer(serializers.Serializer):
    days = serializers.IntegerField(required=False, default=30)


class EmptySerializer(serializers.Serializer):
    pass


class SettingsUpdateRequestSerializer(serializers.Serializer):
    settings = serializers.DictField(required=False, allow_empty=True)


class SettingsUpdateResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(required=False)
    settings = serializers.DictField(required=False, allow_empty=True)
    error = serializers.CharField(required=False, allow_null=True)


class ResetSettingsResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(required=False)
    settings = serializers.DictField(required=False, allow_empty=True)
    error = serializers.CharField(required=False, allow_null=True)


class SurveillanceEventSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, allow_null=True)
    type = serializers.CharField(required=False, allow_null=True)
    message = serializers.CharField(required=False, allow_null=True)
    timestamp = serializers.DateTimeField(required=False, allow_null=True)
    camera_id = serializers.CharField(required=False, allow_null=True)
    severity = serializers.CharField(required=False, allow_null=True)


@extend_schema(responses={200: dict, 500: dict})
@api_view(['GET'])
def system_health(request):
    """
    Get current system health status.
    """
    try:
        health_data = SystemHealthService.get_system_health()
        return Response(health_data)
    except Exception as e:
        logger.error(f"Failed to get system health: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve system health'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(responses={200: dict, 500: dict})
@api_view(['GET'])
def system_alerts(request):
    """
    Get current system alerts and warnings.
    """
    try:
        alerts = SystemHealthService.check_system_alerts()
        return Response({'alerts': alerts})
    except Exception as e:
        logger.error(f"Failed to get system alerts: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve system alerts'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Maximum number of events to return.'
        )
    ],
    responses={200: SurveillanceEventSerializer(many=True), 500: dict},
)
@api_view(['GET'])
def surveillance_events(request):
    """
    Get recent surveillance events.
    """
    try:
        limit = int(request.query_params.get('limit', 50))
        events = EventService.get_recent_events(limit)
        return Response(events)
    except Exception as e:
        logger.error(f"Failed to get surveillance events: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve events'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(request=SystemSettingsInputSerializer, responses={200: dict, 500: dict})
@api_view(['POST'])
def cleanup_events(request):
    """
    Clean up old surveillance events.
    """
    try:
        days = int(request.data.get('days', 30))
        deleted_count = EventService.cleanup_old_events(days)
        return Response({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Cleaned up {deleted_count} old events'
        })
    except Exception as e:
        logger.error(f"Failed to cleanup events: {str(e)}")
        return Response(
            {'error': 'Failed to cleanup events'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(responses={200: dict, 500: dict})
@api_view(['GET'])
def system_settings(request):
    """
    Get current system settings.
    """
    try:
        settings_data = SettingsService.get_settings()
        return Response(settings_data)
    except Exception as e:
        logger.error(f"Failed to get system settings: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve settings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    request=SettingsUpdateRequestSerializer,
    responses={200: SettingsUpdateResponseSerializer, 500: SettingsUpdateResponseSerializer}
)
@api_view(['PUT', 'PATCH'])
def update_system_settings(request):
    """
    Update system settings.
    """
    try:
        updated_settings = SettingsService.update_settings(request.data)
        return Response(updated_settings)
    except Exception as e:
        logger.error(f"Failed to update system settings: {str(e)}")
        return Response(
            {'error': 'Failed to update settings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    request=EmptySerializer,
    responses={200: ResetSettingsResponseSerializer, 500: ResetSettingsResponseSerializer}
)
@api_view(['POST'])
def reset_settings(request):
    """
    Reset system settings to defaults.
    """
    try:
        default_settings = SettingsService.reset_to_defaults()
        return Response(default_settings)
    except Exception as e:
        logger.error(f"Failed to reset settings: {str(e)}")
        return Response(
            {'error': 'Failed to reset settings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )