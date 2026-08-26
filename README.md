# CCTV Surveillance Software

A full-stack surveillance camera management system for Tapo TC40 cameras with live streaming, recording, and PTZ control.

## Features

### 🎥 Live Streaming
- Real-time HLS streaming from RTSP cameras
- Multi-camera grid view
- Adaptive bitrate streaming
- Low-latency playback

### 📹 Recording Management
- Manual and scheduled recording
- FFmpeg-based MP4 recording
- Recording playback and download
- Search and filter recordings
- Automatic cleanup with retention policies

### 🎮 PTZ Control
- Pan/Tilt motor control for Tapo TC40 cameras
- Preset positions
- ONVIF protocol support

### 📊 System Monitoring
- Real-time camera status
- Storage usage tracking
- Event logging
- System health dashboard

## Tech Stack

### Backend
- **Framework**: Django 5.0.2 + Django REST Framework
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Video Processing**: FFmpeg
- **Streaming**: HLS (HTTP Live Streaming)
- **Camera Protocol**: RTSP, ONVIF

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons
- **Video Player**: HLS.js
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)

## Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg (with hardware acceleration support)
- Tapo TC40 or compatible IP cameras

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/bassy1992/cctv-sulellance-software.git
cd cctv-sulellance-software
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Configure SURVEILLANCE_STORAGE_PATH, FFMPEG_PATH, etc.

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will run at http://127.0.0.1:8000/

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at http://localhost:3000/

## Configuration

### Backend Configuration (`.env`)

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Surveillance Settings
SURVEILLANCE_STORAGE_PATH=C:\Users\YourUser\Videos
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
MAX_CONCURRENT_RECORDINGS=6
RETENTION_DAYS=14
```

### Camera Configuration

Add cameras through the web interface:
1. Navigate to Cameras page
2. Click "Add Camera"
3. Enter camera details:
   - Name, Location
   - IP Address (e.g., 192.168.1.212)
   - RTSP Port (default: 554)
   - Username/Password
   - Stream Path (e.g., /stream1)

## Usage

### Adding Cameras
1. Go to **Cameras** page
2. Click **Add Camera** button
3. Fill in camera details
4. Test connection
5. Save camera

### Live Viewing
1. Navigate to **Live Cameras**
2. Click on any camera card to view full-screen
3. Use PTZ controls if supported
4. Toggle record button to start/stop recording

### Managing Recordings
1. Go to **Recordings** page
2. Filter by date, camera, trigger type
3. Search recordings
4. Play, download, or delete recordings

### System Settings
1. Navigate to **Settings**
2. Configure storage path
3. Set retention policies
4. Adjust recording quality

## API Documentation

### Cameras
- `GET /api/cameras/` - List all cameras
- `POST /api/cameras/` - Add new camera
- `GET /api/cameras/{id}/` - Get camera details
- `PATCH /api/cameras/{id}/` - Update camera
- `DELETE /api/cameras/{id}/` - Delete camera
- `POST /api/cameras/{id}/record/start/` - Start recording
- `POST /api/cameras/{id}/record/stop/` - Stop recording
- `POST /api/cameras/{id}/snapshot/` - Take snapshot
- `POST /api/cameras/{id}/ptz/` - PTZ control

### Recordings
- `GET /api/recordings/` - List recordings (paginated)
- `GET /api/recordings/{id}/` - Get recording details
- `DELETE /api/recordings/{id}/` - Delete recording
- `GET /api/recordings/{id}/video/` - Stream video
- `GET /api/recordings/stats/` - Recording statistics

### System
- `GET /api/system/health/` - System health status
- `GET /api/system/storage/` - Storage information
- `GET /api/system/settings/` - System settings
- `PATCH /api/system/settings/` - Update settings

## Project Structure

```
cctv-surveillance-software/
├── backend/
│   ├── apps/
│   │   ├── cameras/        # Camera management
│   │   ├── recordings/     # Recording management
│   │   ├── storage/        # Storage management
│   │   ├── system/         # System settings
│   │   └── websockets/     # WebSocket support (optional)
│   ├── surveillance_vms/   # Django project settings
│   ├── storage/            # Video storage directory
│   ├── logs/               # Application logs
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Troubleshooting

### Recording Not Working
- Verify FFmpeg is installed: `ffmpeg -version`
- Check camera is online and RTSP URL is correct
- Ensure storage path has write permissions
- Check backend logs in `backend/logs/surveillance.log`

### Streaming Issues
- Verify HLS segments are being created in `storage/temp/hls/`
- Check FFmpeg process is running
- Try reducing stream quality in camera settings
- Ensure browser supports HLS playback

### Camera Connection Issues
- Verify camera IP address and credentials
- Check network connectivity
- Ensure RTSP port (554) is accessible
- Try using camera's sub-stream if main stream fails

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FFmpeg for video processing
- Django and Django REST Framework
- React and the React ecosystem
- Tapo camera community

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting guide above

## Roadmap

- [ ] Motion detection with AI
- [ ] Mobile app support
- [ ] Cloud storage integration
- [ ] Multi-user support with authentication
- [ ] Advanced analytics and reports
- [ ] WebRTC support for lower latency
- [ ] Docker deployment
- [ ] Kubernetes deployment configurations

---

**Note**: This is a desktop/local network application. For production deployment, additional security measures should be implemented (authentication, HTTPS, rate limiting, etc.).
