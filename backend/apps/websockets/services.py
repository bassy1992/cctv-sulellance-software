"""
WebSocket services for broadcasting real-time updates.
"""

import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class WebSocketService:
    """
    Service for broadcasting WebSocket messages to connected clients.
    """
    
    @staticmethod
    def broadcast_event(event):
        """
        Broadcast a surveillance event to all connected clients.
        
        Args:
            event: SurveillanceEvent instance
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer not configured for WebSocket broadcasting")
                return
            
            event_data = {
                'id': str(event.id),
                'timestamp': event.timestamp.isoformat(),
                'camera_id': str(event.camera_id) if event.camera_id else None,
                'camera_name': event.camera_name,
                'type': event.event_type,
                'message': event.message,
                'severity': event.severity,
                'metadata': event.metadata
            }
            
            # Broadcast to general surveillance group
            async_to_sync(channel_layer.group_send)(
                'surveillance_updates',
                {
                    'type': 'surveillance_event',
                    'event_data': event_data
                }
            )
            
            # Also broadcast to camera-specific group if applicable
            if event.camera_id:
                async_to_sync(channel_layer.group_send)(
                    f'camera_{event.camera_id}',
                    {
                        'type': 'surveillance_event',
                        'event_data': event_data
                    }
                )
            
            logger.debug(f"Broadcasted event: {event.event_type} - {event.camera_name}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast event: {str(e)}")
    
    @staticmethod
    def broadcast_camera_status(camera_id: str, status: str, camera_name: str = ""):
        """
        Broadcast camera status update.
        
        Args:
            camera_id: Camera UUID
            status: New camera status
            camera_name: Camera name for logging
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Broadcast to general group
            async_to_sync(channel_layer.group_send)(
                'surveillance_updates',
                {
                    'type': 'camera_status_update',
                    'camera_id': camera_id,
                    'status': status,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # Broadcast to camera-specific group
            async_to_sync(channel_layer.group_send)(
                f'camera_{camera_id}',
                {
                    'type': 'camera_status_update',
                    'camera_id': camera_id,
                    'status': status,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            logger.debug(f"Broadcasted camera status: {camera_name} - {status}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast camera status: {str(e)}")
    
    @staticmethod
    def broadcast_recording_status(
        camera_id: str, 
        is_recording: bool, 
        recording_id: Optional[str] = None,
        camera_name: str = ""
    ):
        """
        Broadcast recording status update.
        
        Args:
            camera_id: Camera UUID
            is_recording: Whether camera is currently recording
            recording_id: Recording UUID if applicable
            camera_name: Camera name for logging
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Broadcast to general group
            async_to_sync(channel_layer.group_send)(
                'surveillance_updates',
                {
                    'type': 'recording_status_update',
                    'camera_id': camera_id,
                    'recording_id': recording_id,
                    'is_recording': is_recording,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # Broadcast to camera-specific group
            async_to_sync(channel_layer.group_send)(
                f'camera_{camera_id}',
                {
                    'type': 'recording_status_update',
                    'camera_id': camera_id,
                    'recording_id': recording_id,
                    'is_recording': is_recording,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            status_text = "started" if is_recording else "stopped"
            logger.debug(f"Broadcasted recording status: {camera_name} - {status_text}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast recording status: {str(e)}")
    
    @staticmethod
    def broadcast_system_alert(alert_data: Dict[str, Any]):
        """
        Broadcast system alert to all clients.
        
        Args:
            alert_data: Alert information dictionary
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            async_to_sync(channel_layer.group_send)(
                'surveillance_updates',
                {
                    'type': 'system_alert',
                    'alert_data': alert_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            logger.debug(f"Broadcasted system alert: {alert_data.get('type', 'unknown')}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast system alert: {str(e)}")
    
    @staticmethod
    def broadcast_storage_update(storage_data: Dict[str, Any]):
        """
        Broadcast storage status update.
        
        Args:
            storage_data: Storage status information
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            async_to_sync(channel_layer.group_send)(
                'surveillance_updates',
                {
                    'type': 'storage_update',
                    'storage_data': storage_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            logger.debug("Broadcasted storage update")
            
        except Exception as e:
            logger.error(f"Failed to broadcast storage update: {str(e)}")
    
    @staticmethod
    def broadcast_stream_frame(camera_id: str, frame_data: bytes):
        """
        Broadcast video frame data to camera stream clients.
        
        Args:
            camera_id: Camera UUID
            frame_data: Raw frame data
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            async_to_sync(channel_layer.group_send)(
                f'camera_stream_{camera_id}',
                {
                    'type': 'stream_frame',
                    'frame_data': frame_data
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to broadcast stream frame: {str(e)}")
    
    @staticmethod
    def broadcast_stream_metadata(camera_id: str, metadata: Dict[str, Any]):
        """
        Broadcast stream metadata to camera stream clients.
        
        Args:
            camera_id: Camera UUID
            metadata: Stream metadata
        """
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            async_to_sync(channel_layer.group_send)(
                f'camera_stream_{camera_id}',
                {
                    'type': 'stream_metadata',
                    'metadata': metadata
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to broadcast stream metadata: {str(e)}")