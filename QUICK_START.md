# CCTV Surveillance - Quick Start Guide

## ✅ What You Have Now

Your CCTV surveillance software is now an **installable Windows desktop application** with:

- 🖥️ **Native Windows installer** (.exe file)
- 🌐 **Online installation** - Downloads latest code from GitHub automatically
- 🔄 **Auto-updates** - Users get updates automatically from GitHub releases
- 📦 **All-in-one package** - Backend + Frontend integrated

## 📋 For Building the Installer

### Prerequisites on Development Machine

- Windows 10/11
- Node.js 18+ installed
- Git installed

### Build Steps

```powershell
# 1. Navigate to electron app
cd "c:\Users\Comme\Desktop\cc tv camera\electron-app"

# 2. Install dependencies (one-time, may take 5-10 minutes)
npm install

# 3. Build Windows installer
npm run build:win
```

### Output

After building:
```
electron-app/dist/
└── CCTV Surveillance Setup 1.0.0.exe  (30-50MB)
```

This is your installer! Upload it to GitHub Releases.

## 🚀 For Distributing to Users

### Step 1: Create GitHub Release

```powershell
# Tag your current version
cd "c:\Users\Comme\Desktop\cc tv camera"
git tag v1.0.0
git push origin v1.0.0
```

### Step 2: Upload Installer

1. Go to: https://github.com/bassy1992/cctv-sulellance-software/releases
2. Click **"Create a new release"**
3. Select tag: `v1.0.0`
4. Title: **"CCTV Surveillance v1.0.0"**
5. Upload: `electron-app/dist/CCTV Surveillance Setup 1.0.0.exe`
6. Click **"Publish release"**

### Step 3: Share with Users

Send them the release URL:
```
https://github.com/bassy1992/cctv-sulellance-software/releases
```

## 👥 For End Users

### Prerequisites (Users Must Install First)

Before installing CCTV Surveillance:

1. **Python 3.10+**: https://www.python.org/downloads/
   - ✅ Check "Add Python to PATH" during installation
   
2. **Node.js 18+**: https://nodejs.org/
   - Download and install LTS version
   
3. **FFmpeg**: https://www.gyan.dev/ffmpeg/builds/
   - Download "ffmpeg-release-full.7z"
   - Extract to `C:\ffmpeg`
   - Add `C:\ffmpeg\bin` to System PATH

### Installation Steps

1. Download `CCTV Surveillance Setup 1.0.0.exe` from GitHub releases
2. Run the installer
3. Follow the installation wizard
4. On first launch:
   - App downloads latest code from GitHub (~5-15 minutes)
   - Installs Python packages automatically
   - Installs Node.js packages automatically
   - Starts automatically when done
5. Add your cameras and start monitoring!

### Verify Prerequisites

Open Command Prompt and check:
```cmd
python --version
# Should show: Python 3.10.x or higher

node --version
# Should show: v18.x.x or higher

ffmpeg -version
# Should show FFmpeg version info
```

## 🔄 For Updating

### Releasing Updates

1. Make changes to your code
2. Update version in `electron-app/package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```
3. Build new installer:
   ```powershell
   cd electron-app
   npm run build:win
   ```
4. Create new release:
   ```powershell
   git tag v1.0.1
   git push origin v1.0.1
   ```
5. Upload new installer to GitHub release v1.0.1

### Users Get Updates Automatically

- App checks GitHub on launch
- Shows notification when update available
- Downloads and installs with one click
- No manual reinstallation needed!

## 🧪 For Testing

### Development Mode (Local Testing)

```powershell
cd electron-app
npm run dev
```

This:
- Uses your local backend/frontend code
- Doesn't download from GitHub
- Shows DevTools for debugging
- Skips auto-update checks

### Test Built App

```powershell
npm run build:dir
cd dist\win-unpacked
."CCTV Surveillance.exe"
```

## 📍 Where Things Are Installed

### For Users

```
# Application
C:\Program Files\CCTV Surveillance\

# User Data  
%APPDATA%\CCTV-Surveillance\
├── app\
│   ├── backend\     (Downloaded from GitHub)
│   └── frontend\    (Downloaded from GitHub)
└── logs\
    └── app.log      (Application logs)

# Recordings (configurable in app)
C:\Users\USERNAME\Videos\
```

## 🐛 Troubleshooting

### Build Fails

**"electron-builder not found"**
```powershell
cd electron-app
npm install --save-dev electron-builder
```

**"Cannot find module"**
```powershell
cd electron-app
rm -rf node_modules
rm package-lock.json
npm install
```

### Installation Fails for Users

**"Python not found"**
- User must install Python 3.10+
- Must check "Add to PATH" during installation
- Restart computer after installing

**"Node.js not found"**
- User must install Node.js 18+
- Restart computer after installing

**"Installation hangs"**
- Check internet connection
- Temporarily disable antivirus
- Check logs: `%APPDATA%\CCTV-Surveillance\logs\app.log`

### App Won't Start

**Port 8000 already in use**
```cmd
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /F /PID <PID>
```

## 📚 Documentation

- **For Developers**: `electron-app/README.md`
- **For Users**: `electron-app/INSTALLATION_GUIDE.md`
- **Complete Guide**: `ELECTRON_SETUP.md`

## 🎯 Quick Commands Reference

```powershell
# Build installer
cd electron-app
npm run build:win

# Test locally
npm run dev

# Create release
git tag v1.0.0
git push origin v1.0.0

# Check logs (Windows)
type %APPDATA%\CCTV-Surveillance\logs\app.log

# Verify prerequisites
python --version
node --version
ffmpeg -version
```

## ✨ Features

Your desktop app includes:

- ✅ **Live Streaming** - Real-time HLS from RTSP cameras
- ✅ **Recording** - Manual and scheduled recording
- ✅ **PTZ Control** - Pan/Tilt for compatible cameras
- ✅ **Multi-Camera** - Grid view with multiple cameras
- ✅ **Storage Management** - Automatic cleanup with retention
- ✅ **System Dashboard** - Health monitoring and stats
- ✅ **Auto-Updates** - Automatic updates from GitHub
- ✅ **Offline Mode** - Works without internet (after installation)

## 🆘 Support

**For Users:**
- Check `%APPDATA%\CCTV-Surveillance\logs\app.log`
- Read `INSTALLATION_GUIDE.md`
- Open GitHub issue

**For Developers:**
- Check `electron-app/README.md`
- Read `ELECTRON_SETUP.md`
- Test with `npm run dev`

## 🎉 Success!

Your CCTV surveillance software is now:
- ✅ A native Windows desktop application
- ✅ Installable via .exe installer
- ✅ Auto-updating from GitHub
- ✅ Production-ready for distribution

**Next steps:**
1. Build the installer: `npm run build:win`
2. Test it locally
3. Create GitHub release
4. Share with users!

---

**Repository**: https://github.com/bassy1992/cctv-sulellance-software
**Releases**: https://github.com/bassy1992/cctv-sulellance-software/releases
