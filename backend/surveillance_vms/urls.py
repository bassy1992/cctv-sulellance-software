"""
URL configuration for Tapo Surveillance VMS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include([
        path('cameras/', include('apps.cameras.urls')),
        path('recordings/', include('apps.recordings.urls')),
        path('storage/', include('apps.storage.urls')),
        path('system/', include('apps.system.urls')),
    ])),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)