"""
URL configuration for system app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.system_health, name='system-health'),
    path('alerts/', views.system_alerts, name='system-alerts'),
    path('events/', views.surveillance_events, name='surveillance-events'),
    path('events/cleanup/', views.cleanup_events, name='cleanup-events'),
    path('settings/', views.system_settings, name='system-settings'),
    path('settings/update/', views.update_system_settings, name='update-system-settings'),
    path('settings/reset/', views.reset_settings, name='reset-settings'),
]