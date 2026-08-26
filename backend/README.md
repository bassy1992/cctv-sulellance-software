# Tapo Surveillance VMS Backend

Django REST API backend for the Tapo Surveillance Video Management System.

## Features

- **Camera Management**: Add, configure, and monitor Tapo TC40 IP cameras
- **Video Recording**: FFmpeg-based recording with hardware acceleration support
- **Storage Management**: Disk usage monitoring and retention policies
- **Real-time Communication**: WebSocket support for live updates
- **PTZ Control**: Pan/tilt/zoom control via ONVIF protocol
- **System Health**: Performance monitoring and alerting
- **Event Logging**: Comprehensive audit trail of surveillance events

## Technology Stack

- **Django 5.0**: Web framework and ORM
- **Django REST Framework**: API framework
- **Channels**: WebSocket support
- **Celery**: Background task processing
- **Redis**: Message broker and caching
- **FFmpeg**: Video processing and streaming
- **OpenCV**: Computer vision and stream handling
- **SQLite**: Database (easily replaceable with PostgreSQL/MySQL)

## Quick Start

### Prerequisites

- Python 3.9+
- FFmpeg installed and available in PATH
- Redis server (for WebSockets and background tasks)

### Installation

1. **Create virtual environment:**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Environment setup:**
```bash
# Copy and edit environment file
copy .env.example .env
# Edit .env with your configuration
```

4. **Database setup:**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

5. **Create storage directories:**
```bash
# Windows
mkdir "D:\TapoSurveillance\Recordings"
mkdir "D:\TapoSurveillance\Temp"  
mkdir "D:\TapoSurveillance\Snapshots"
```

6. **Start services:**
```bash
# Terminal 1: Redis server
redis-server

# Terminal 2: Django development server
python manage.py runserver 127.0.0.1:8000

# Terminal 3: Celery worker (for background tasks)
celery -A surveillance_vms worker --loglevel=info

# Terminal 4: Celery beat (for scheduled tasks)
celery -A surveillance_vms beat --loglevel=info
```

## API Endpoints

### Cameras
- `GET /api/cameras/` - List all cameras
- `POST /api/cameras/` - Add new camera
- `GET /api/cameras/{id}/` - Get camera details
- `PUT /api/cameras/{id}/` - Update camera
- `DELETE /api/cameras/{id}/` - Delete camera
- `POST /api/cameras/test_connection/` - Test camera connection
- `POST /api/cameras/{id}/start_recording/` - Start recording
- `POST /api/cameras/{id}/stop_recording/` - Stop recording
- `POST /api/cameras/{id}/ptz_control/` - PTZ control
- `POST /api/cameras/{id}/take_snapshot/` - Capture snapshot
- `GET /api/cameras/{id}/stream/` - Get stream info

### Recordings
- `GET /api/recordings/` - List recordings (with filtering)
- `GET /api/recordings/{id}/` - Get recording details
- `DELETE /api/recordings/{id}/` - Delete recording
- `GET /api/recordings/{id}/video/` - Stream/download video
- `GET /api/recordings/stats/` - Recording statistics
- `GET /api/recordings/active/` - Active recordings
- `POST /api/recordings/cleanup/` - Clean up old recordings

### Storage
- `GET /api/storage/status/` - Storage status and analytics
- `POST /api/storage/retention/` - Update retention policy
- `POST /api/storage/cleanup/` - Run cleanup
- `GET /api/storage/health/` - Storage health metrics

### System
- `GET /api/system/health/` - System health status
- `GET /api/system/alerts/` - System alerts
- `GET /api/system/events/` - Surveillance events
- `POST /api/system/events/cleanup/` - Clean up old events
- `GET /api/system/settings/` - System settings
- `PUT /api/system/settings/update/` - Update settings
- `POST /api/system/settings/reset/` - Reset to defaults

### WebSocket Endpoints
- `ws://localhost:8000/ws/surveillance/` - General system updates
- `ws://localhost:8000/ws/camera/{id}/stream/` - Camera streaming

## Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Django
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Storage paths
SURVEILLANCE_STORAGE_PATH=D:\TapoSurveillance\Recordings
SURVEILLANCE_TEMP_PATH=D:\TapoSurveillance\Temp
SURVEILLANCE_SNAPSHOTS_PATH=D:\TapoSurveillance\Snapshots

# FFmpeg
FFMPEG_PATH=ffmpeg
FFMPEG_HARDWARE_ACCELERATION=auto  # auto, nvenc, qsv, cpu

# Recording
DEFAULT_RECORDING_DURATION=900
RETENTION_DAYS=14
MAX_CONCURRENT_RECORDINGS=6

# Redis (for WebSockets/Celery)
REDIS_URL=redis://localhost:6379/0
```

### Camera Configuration

Cameras are configured with:
- IP address and RTSP port (usually 554)
- Username/password for authentication
- ONVIF port for PTZ control (usually 2020)
- Stream paths (typically `/stream1` for main, `/stream2` for sub)

## Development

### Running Tests
```bash
python manage.py test
```

### Code Style
```bash
# Format code
black .
isort .

# Lint code
flake8 .
pylint apps/
```

### Database Migrations
```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

## Production Deployment

### Using Docker
```bash
# Build image
docker build -t tapo-surveillance-backend .

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment
1. Use PostgreSQL instead of SQLite
2. Configure Nginx for static files and reverse proxy
3. Use Gunicorn + Uvicorn for ASGI/WSGI
4. Set up Redis persistence
5. Configure Celery as system service
6. Set up log rotation and monitoring

## Troubleshooting

### Common Issues

**FFmpeg not found:**
- Ensure FFmpeg is installed and in system PATH
- On Windows: Download from https://ffmpeg.org/download.html
- Update `FFMPEG_PATH` in `.env` if needed

**RTSP connection failed:**
- Verify camera IP address and credentials
- Check firewall settings
- Ensure camera RTSP is enabled

**Redis connection error:**
- Install and start Redis server
- Verify `REDIS_URL` in `.env`

**High CPU usage:**
- Reduce concurrent recordings (`MAX_CONCURRENT_RECORDINGS`)
- Use hardware acceleration (`FFMPEG_HARDWARE_ACCELERATION=nvenc`)
- Lower video quality/bitrate

### Logging

Logs are written to:
- Console (development)
- `logs/surveillance.log` (production)

Configure log levels in `settings.py`:
```python
LOGGING['loggers']['surveillance_vms']['level'] = 'DEBUG'
```

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Django and FFmpeg documentation
3. Submit issues with detailed error logs and system information