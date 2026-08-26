"""
WebSocket URL routing for surveillance system.
"""

from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    # General surveillance system updates
    re_path(r'ws/surveillance/$', consumers.SurveillanceConsumer.as_asgi()),
    
    # Individual camera streaming
    re_path(r'ws/camera/(?P<camera_id>[0-9a-f-]+)/stream/$', consumers.CameraStreamConsumer.as_asgi()),
]