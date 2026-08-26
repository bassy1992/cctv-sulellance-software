# CCTV Surveillance - Windows Installation Guide

## For End Users

### System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space
- **Internet**: Required for installation and updates

### Prerequisites (Must Install First)

Before installing CCTV Surveillance, you need:

#### 1. Python 3.10 or Higher
- Download: https://www.python.org/downloads/
- During installation, CHECK "Add Python to PATH"
- Verify: Open CMD and type `python --version`

#### 2. Node.js 18 or Higher  
- Download: https://nodejs.org/
- Install LTS version
- Verify: Open CMD and type `node --version`

#### 3. FFmpeg
- Download: https://www.gyan.dev/ffmpeg/builds/
- Get "ffmpeg-release-full.7z"
- Extract and add to PATH:
  1. Extract to `C:\ffmpeg`
  2. Add `C:\ffmpeg\bin` to System PATH
  3. Restart CMD
- Verify: Type `ffmpeg -version`

### Installation Steps

1. **Download Installer**
   - Get `CCTV Surveillance Setup X.X.X.exe` from GitHub Releases
   - URL: https://github.com/bassy1992/cctv-sulellance-software/releases

2. **Run Installer**
   - Double-click the `.exe` file
   - Follow installation wizard
   - Choose installation directory
   - Create desktop shortcut (recommended)

3. **First Launch**
   - App will show "Installing" screen
   - Downloads latest code from GitHub (~50MB)
   - Installs Python packages (~200MB)
   - Installs Node.js packages (~300MB)
   - May take 5-15 minutes depending on internet speed
   - **DO NOT CLOSE** during first installation

4. **Application Starts**
   - Backend starts automatically
   - Frontend opens in window
   - System tray icon appears
   - Ready to add cameras!

### Using the Application

#### Adding Your First Camera

1. Click "Cameras" in sidebar
2. Click "Add Camera" button
3. Fill in details:
   - **Name**: "Front Door" (or any name)
   - **IP Address**: Your camera's local IP (e.g., 192.168.1.212)
   - **Port**: 554 (default for RTSP)
   - **Username**: Camera admin username
   - **Password**: Camera admin password
   - **Stream Path**: /stream1 (for Tapo TC40)
   - **Location**: Physical location description
4. Click "Test Connection"
5. If successful, click "Save"

#### Live Viewing

1. Go to "Live Cameras" page
2. Click any online camera to view
3. Use controls:
   - 🔴 Record button - Start/stop recording
   - 📸 Snapshot - Take picture
   - 🎮 PTZ Controls - Pan/tilt camera (if supported)

#### Managing Recordings

1. Go to "Recordings" page
2. Filter by date, camera, or search
3. Actions:
   - ▶️ Play - Watch recording
   - ⬇️ Download - Save to computer
   - 🗑️ Delete - Remove recording

### Uninstallation

1. Close the application
2. Go to Windows Settings > Apps
3. Find "CCTV Surveillance"
4. Click Uninstall
5. Optionally delete data: `%APPDATA%\CCTV-Surveillance`

### Updates

The app checks for updates automatically:

1. Notification appears when update available
2. Click "Download"
3. Update downloads in background
4. Click "Restart to Update"
5. App restarts with new version

### Troubleshooting

#### "Python not found" Error

**Solution**:
1. Install Python from python.org
2. During installation, check "Add to PATH"
3. Restart computer
4. Try again

#### "Node.js not found" Error

**Solution**:
1. Install Node.js from nodejs.org
2. Restart computer
3. Try again

#### "FFmpeg not found" Warning

**Solution**:
1. Download FFmpeg
2. Extract to C:\ffmpeg
3. Add C:\ffmpeg\bin to PATH:
   - Right-click "This PC" > Properties
   - Advanced System Settings
   - Environment Variables
   - Edit "Path" in System Variables
   - Add new entry: `C:\ffmpeg\bin`
   - Click OK, restart CMD

#### Installation Hangs

**Solution**:
1. Check internet connection
2. Disable antivirus temporarily
3. Check logs:
   - Press `Win+R`
   - Type: `%APPDATA%\CCTV-Surveillance\logs`
   - Open `app.log`
4. Report error to developer

#### Camera Won't Connect

**Checklist**:
- ✓ Camera is powered on
- ✓ Camera is on same network
- ✓ IP address is correct
- ✓ Username/password are correct
- ✓ Port 554 is accessible
- ✓ RTSP is enabled on camera

**Test**:
```
# In CMD, try:
ffmpeg -rtsp_transport tcp -i rtsp://username:password@IP/stream1 -frames:v 1 test.jpg
```

#### Recording Not Working

**Checklist**:
- ✓ FFmpeg is installed and in PATH
- ✓ Storage path has write permission
- ✓ Enough disk space available
- ✓ Camera stream is working

**Test**:
1. Go to Live Cameras
2. If stream shows, recording should work
3. Check logs for errors

#### App Won't Start

**Solution**:
1. Check if port 8000 is free:
   ```
   netstat -ano | findstr :8000
   ```
2. Kill any process using port 8000
3. Restart app
4. If still failing, reinstall

### Getting Help

#### Check Logs
```
%APPDATA%\CCTV-Surveillance\logs\app.log
```

#### GitHub Issues
https://github.com/bassy1992/cctv-sulellance-software/issues

#### System Info to Provide
- Windows version
- Python version (`python --version`)
- Node.js version (`node --version`)
- FFmpeg version (`ffmpeg -version`)
- Error message from logs

## For Developers

### Building the Installer

1. **Setup**:
   ```bash
   cd electron-app
   npm install
   ```

2. **Build**:
   ```bash
   npm run build:win
   ```

3. **Output**:
   - `dist/CCTV Surveillance Setup X.X.X.exe`

### Publishing Release

1. **Tag Version**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub Release**:
   - Go to repository releases
   - Click "Create new release"
   - Select tag v1.0.0
   - Upload `.exe` installer
   - Publish

3. **Users Get Update**:
   - App auto-checks GitHub
   - Notifies users of new version
   - Auto-downloads and installs

### Testing

**Development Mode**:
```bash
npm run dev
```

**Test Install**:
```bash
npm run build:dir
cd dist/win-unpacked
"CCTV Surveillance.exe"
```

### Auto-Update Flow

1. App checks GitHub releases on launch
2. Compares current version with latest
3. If newer version exists:
   - Shows notification
   - Downloads `.exe` installer
   - Verifies signature
   - Installs on restart

4. Component updates (backend/frontend):
   - Downloads from GitHub repo directly
   - Extracts to app data folder
   - Installs dependencies
   - Runs migrations

## FAQ

**Q: Do I need internet after installation?**
A: No, but updates require internet.

**Q: Where are recordings saved?**
A: Default: `C:\Users\YOUR_USERNAME\Videos`
Configurable in Settings.

**Q: Can I use with other cameras?**
A: Yes! Any RTSP-compatible camera works.

**Q: How much disk space for recordings?**
A: ~1-2GB per hour at 1080p
Configurable retention period (default 14 days)

**Q: Is my data private?**
A: Yes! Everything runs locally.
No data is sent to external servers.

**Q: Can I run on multiple PCs?**
A: Yes, install on each PC.
Recordings are per-installation.

**Q: How many cameras supported?**
A: Up to 6 concurrent recordings (configurable)
Unlimited total cameras

**Q: System tray icon?**
A: Minimize to tray for background operation.
Recording continues when minimized.

## Support

Need help? 

1. Check logs: `%APPDATA%\CCTV-Surveillance\logs\app.log`
2. Read troubleshooting guide above
3. Open GitHub issue with:
   - Operating system
   - Error message
   - Log excerpts
   - Steps to reproduce

---

**Thank you for using CCTV Surveillance!**
