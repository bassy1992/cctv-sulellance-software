"""
WebSocket consumers for real-time surveillance system communication.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class SurveillanceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time surveillance system updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.group_name = 'surveillance_updates'
        
        # Join surveillance group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected: {self.channel_name}")
        
        # Send initial connection message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to surveillance system',
            'timestamp': timezone.now().isoformat()
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave surveillance group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        logger.info(f"WebSocket disconnected: {self.channel_name} (code: {close_code})")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
            elif message_type == 'subscribe':
                # Handle subscription to specific events
                await self.handle_subscription(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from WebSocket client")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
    
    async def handle_subscription(self, data):
        """Handle client subscription requests."""
        subscription_type = data.get('subscription_type')
        
        if subscription_type == 'camera_events':
            camera_id = data.get('camera_id')
            if camera_id:
                # Join camera-specific group
                camera_group = f'camera_{camera_id}'
                await self.channel_layer.group_add(
                    camera_group,
                    self.channel_name
                )
                
                await self.send(text_data=json.dumps({
                    'type': 'subscription_confirmed',
                    'subscription_type': 'camera_events',
                    'camera_id': camera_id,
                    'message': f'Subscribed to camera {camera_id} events'
                }))
        elif subscription_type == 'system_events':
            # Already subscribed to general surveillance group
            await self.send(text_data=json.dumps({
                'type': 'subscription_confirmed',
                'subscription_type': 'system_events',
                'message': 'Subscribed to system events'
            }))
    
    # Group message handlers
    async def surveillance_event(self, event):
        """Handle surveillance event broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'surveillance_event',
            'event': event['event_data']
        }))
    
    async def camera_status_update(self, event):
        """Handle camera status update broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'camera_status_update',
            'camera_id': event['camera_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))
    
    async def recording_status_update(self, event):
        """Handle recording status update broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'recording_status_update',
            'camera_id': event['camera_id'],
            'recording_id': event.get('recording_id'),
            'is_recording': event['is_recording'],
            'timestamp': event['timestamp']
        }))
    
    async def system_alert(self, event):
        """Handle system alert broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'system_alert',
            'alert': event['alert_data'],
            'timestamp': event['timestamp']
        }))
    
    async def storage_update(self, event):
        """Handle storage update broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'storage_update',
            'storage_data': event['storage_data'],
            'timestamp': event['timestamp']
        }))


class CameraStreamConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for individual camera streaming.
    """
    
    async def connect(self):
        """Handle camera stream WebSocket connection."""
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.group_name = f'camera_stream_{self.camera_id}'
        
        # Verify camera exists
        camera_exists = await self.check_camera_exists(self.camera_id)
        if not camera_exists:
            await self.close(code=4004)  # Camera not found
            return
        
        # Join camera stream group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Camera stream WebSocket connected: {self.camera_id}")
        
        # Send stream ready message
        await self.send(text_data=json.dumps({
            'type': 'stream_ready',
            'camera_id': self.camera_id,
            'message': 'Stream connection established'
        }))
    
    async def disconnect(self, close_code):
        """Handle camera stream disconnection."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
        logger.info(f"Camera stream WebSocket disconnected: {self.camera_id}")
    
    async def receive(self, text_data):
        """Handle camera stream control messages."""
        try:
            data = json.loads(text_data)
            command = data.get('command')
            
            if command == 'start_stream':
                await self.handle_start_stream()
            elif command == 'stop_stream':
                await self.handle_stop_stream()
            elif command == 'request_keyframe':
                await self.handle_keyframe_request()
            else:
                logger.warning(f"Unknown stream command: {command}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from camera stream WebSocket")
        except Exception as e:
            logger.error(f"Error handling camera stream message: {str(e)}")
    
    async def handle_start_stream(self):
        """Handle stream start request."""
        # In production, this would initiate FFmpeg HLS conversion
        await self.send(text_data=json.dumps({
            'type': 'stream_started',
            'camera_id': self.camera_id,
            'hls_url': f'/api/cameras/{self.camera_id}/stream.m3u8'
        }))
    
    async def handle_stop_stream(self):
        """Handle stream stop request."""
        await self.send(text_data=json.dumps({
            'type': 'stream_stopped',
            'camera_id': self.camera_id
        }))
    
    async def handle_keyframe_request(self):
        """Handle keyframe request for stream seeking."""
        await self.send(text_data=json.dumps({
            'type': 'keyframe_sent',
            'camera_id': self.camera_id
        }))
    
    @database_sync_to_async
    def check_camera_exists(self, camera_id):
        """Check if camera exists in database."""
        from apps.cameras.models import Camera
        try:
            Camera.objects.get(id=camera_id)
            return True
        except Camera.DoesNotExist:
            return False
    
    # Stream message handlers
    async def stream_frame(self, event):
        """Handle frame data broadcast."""
        await self.send(bytes_data=event['frame_data'])
    
    async def stream_metadata(self, event):
        """Handle stream metadata broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'stream_metadata',
            'metadata': event['metadata']
        }))