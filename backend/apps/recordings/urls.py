"""
URL configuration for recordings app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecordingViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', RecordingViewSet, basename='recordings')

urlpatterns = [
    path('', include(router.urls)),
]