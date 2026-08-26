"""
URL configuration for cameras app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CameraViewSet, hls_playlist, hls_file

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', CameraViewSet, basename='cameras')

urlpatterns = [
    path('<uuid:camera_id>/stream.m3u8', hls_playlist, name='camera-hls-playlist'),
    path('<uuid:camera_id>/stream/<str:profile>/<str:filename>', hls_file, name='camera-hls-file'),
    path('', include(router.urls)),
]