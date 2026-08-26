# CCTV Surveillance - Windows Desktop Application

Electron-wrapped Windows installer for the CCTV Surveillance Software with automatic updates from GitHub.

## Features

- ✅ **One-Click Windows Installer** - Easy NSIS installer for Windows
- ✅ **Online Installation** - Downloads latest code from GitHub during first run
- ✅ **Auto-Updates** - Automatic updates from GitHub releases
- ✅ **Integrated Backend** - Django server runs automatically
- ✅ **System Tray Support** - Runs in background
- ✅ **Offline Logs** - Full logging for troubleshooting

## Prerequisites

Users need to have installed:
- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **FFmpeg** - [Download](https://ffmpeg.org/download.html)

## Building the Installer

### 1. Install Dependencies

```bash
cd electron-app
npm install
```

### 2. Build for Windows

```bash
npm run build:win
```

This creates an installer in `electron-app/dist/` directory:
- `CCTV Surveillance Setup X.X.X.exe` - Windows installer

### 3. Test Development Version

```bash
npm run dev
```

## How It Works

### First Launch
1. User runs the installer
2. App checks if components are installed
3. If not, downloads latest code from GitHub
4. Installs Python dependencies (in virtual environment)
5. Installs Node.js dependencies
6. Runs Django migrations
7. Starts backend and frontend
8. Opens application window

### Subsequent Launches
1. Starts Django backend
2. Loads frontend from localhost:8000
3. Checks for updates in background

### Auto-Updates
1. App checks GitHub releases every launch
2. Downloads updates automatically
3. Prompts user to restart and install
4. Updates both app and components

## Directory Structure

```
electron-app/
├── main.js              # Main Electron process
├── preload.js           # Preload script for security
├── installer.js         # GitHub downloader & installer
├── package.json         # NPM configuration
├── assets/
│   └── installing.html  # Installation progress UI
├── icon.png            # App icon
└── dist/               # Build output (after npm run build)
```

## Installation Locations

### Application Data
- **Windows**: `%APPDATA%\CCTV-Surveillance\`
  - `app/` - Installed backend/frontend
  - `logs/` - Application logs

### Logs
- `%APPDATA%\CCTV-Surveillance\logs\app.log`

## Publishing Releases

### 1. Create GitHub Release

```bash
# Tag your code
git tag v1.0.0
git push origin v1.0.0
```

On GitHub:
1. Go to Releases
2. Create new release
3. Upload the built installer (`.exe` file)
4. Publish release

### 2. Auto-Update Configuration

The app is configured to check:
- **Repository**: `bassy1992/cctv-sulellance-software`
- **Release Type**: `release` (not draft or pre-release)

Users will be notified of updates automatically.

## Configuration

### Change Update Repository

Edit `electron-app/package.json`:

```json
"build": {
  "publish": [{
    "provider": "github",
    "owner": "YOUR-USERNAME",
    "repo": "YOUR-REPO-NAME"
  }]
}
```

### Change App Details

Edit `electron-app/package.json`:

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "description": "Your description",
  "author": "Your Name"
}
```

## Troubleshooting

### Installation Fails

1. **Check Prerequisites**:
   - Verify Python is installed: `python --version`
   - Verify Node.js is installed: `node --version`
   - Verify FFmpeg is installed: `ffmpeg -version`

2. **Check Logs**:
   - Open logs: `%APPDATA%\CCTV-Surveillance\logs\app.log`
   - Look for error messages

3. **Manual Installation**:
   ```bash
   # Navigate to app directory
   cd %APPDATA%\CCTV-Surveillance\app
   
   # Backend
   cd backend
   python -m venv venv
   venv\Scripts\pip install -r requirements.txt
   venv\Scripts\python manage.py migrate
   
   # Frontend
   cd ..\frontend
   npm install
   npm run build
   ```

### App Won't Start

1. **Check Backend**:
   ```bash
   cd %APPDATA%\CCTV-Surveillance\app\backend
   venv\Scripts\python manage.py runserver
   ```

2. **Check Port 8000**:
   - Make sure nothing else is using port 8000
   - Kill any existing Django processes

3. **Reinstall**:
   - Uninstall app
   - Delete `%APPDATA%\CCTV-Surveillance`
   - Reinstall

### Updates Not Working

1. **GitHub Token**: For private repos, you need a GitHub token
2. **Release Format**: Ensure releases are marked as "release", not "draft"
3. **Version Numbers**: Use semantic versioning (1.0.0, 1.0.1, etc.)

## Development

### Run in Development Mode

```bash
npm run dev
```

This:
- Skips update checks
- Shows more verbose logging
- Doesn't require building

### Debug

1. **Open DevTools**: Press `Ctrl+Shift+I` in the app
2. **Check Console**: Look for errors
3. **Check Logs**: View `%APPDATA%\CCTV-Surveillance\logs\app.log`

## Building for Distribution

### Create Portable Version

```bash
npm run build:dir
```

Creates an unpacked directory instead of installer.

### Create Installer

```bash
npm run build:win
```

Creates NSIS installer with:
- Installation directory chooser
- Desktop shortcut
- Start menu entry
- Uninstaller

## Security

### Code Signing (Optional)

For production, sign your installer:

1. Get a code signing certificate
2. Add to `package.json`:

```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "your-password"
}
```

### Update Verification

The app uses `electron-updater` which verifies update signatures automatically.

## License

MIT License - See LICENSE.txt

## Support

For issues:
- Check logs at `%APPDATA%\CCTV-Surveillance\logs\`
- Open issue on GitHub
- Check documentation

## Credits

- Electron
- electron-builder
- electron-updater
- Django
- React
