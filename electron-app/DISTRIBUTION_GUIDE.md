# CCTV Surveillance - Distribution Guide

## ✅ YOU NOW HAVE A WINDOWS EXECUTABLE!

Location: `electron-app/dist/CCTV-Surveillance-v1.0.0-Windows.zip` (102.5 MB)

## 📦 What's Inside the ZIP

```
CCTV-Surveillance-win32-x64/
├── CCTV Surveillance.exe        ← Main application (users run this)
├── Launch CCTV Surveillance.bat ← Alternative launcher
├── README.txt                   ← User instructions
├── resources/
│   └── app/                     ← Your Electron code
│       ├── main.js
│       ├── installer.js
│       ├── preload.js
│       └── assets/
└── [Electron runtime files]
```

## 🚀 How to Distribute

### Option 1: GitHub Releases (Recommended)

1. **Create a Release:**
   ```powershell
   cd "c:\Users\Comme\Desktop\cc tv camera"
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Upload to GitHub:**
   - Go to: https://github.com/bassy1992/cctv-sulellance-software/releases
   - Click "Create a new release"
   - Select tag `v1.0.0`
   - Title: "CCTV Surveillance v1.0.0"
   - Upload: `electron-app/dist/CCTV-Surveillance-v1.0.0-Windows.zip`
   - Publish

3. **Share the Link:**
   ```
   https://github.com/bassy1992/cctv-sulellance-software/releases/latest
   ```

### Option 2: Direct Distribution

Simply share the ZIP file via:
- Email
- Google Drive / Dropbox
- WeTransfer
- Your website

## 📝 User Instructions

### For End Users:

1. **Download** `CCTV-Surveillance-v1.0.0-Windows.zip`

2. **Extract** the ZIP file to any folder (e.g., `C:\Program Files\`)

3. **Run** `CCTV Surveillance.exe`

4. **First Launch:**
   - App shows installation screen
   - Downloads latest code from GitHub
   - Installs Python packages
   - Installs Node packages
   - Takes 5-15 minutes
   - **DO NOT CLOSE** during installation

5. **Ready!** Start adding cameras

### Prerequisites (Must Be Installed First):

- **Python 3.10+**: https://www.python.org/downloads/
  - ✅ Check "Add Python to PATH"
  
- **Node.js 18+**: https://nodejs.org/
  
- **FFmpeg**: https://www.gyan.dev/ffmpeg/builds/
  - Extract to `C:\ffmpeg`
  - Add `C:\ffmpeg\bin` to PATH

## 🔄 Updating the Application

### Creating New Versions:

1. **Make changes** to your code

2. **Update version:**
   - Edit `electron-app/package.json`
   - Change `"version": "1.0.1"`

3. **Rebuild:**
   ```powershell
   cd electron-app
   .\manual-build.ps1
   ```

4. **Create release:**
   ```powershell
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. **Upload** new ZIP to GitHub releases

6. **Users get notified** automatically!

## 🛠️ Building the Installer

### Quick Build:

```powershell
cd electron-app
.\manual-build.ps1
```

### What It Does:

1. Downloads Electron 28.3.3 (~100MB)
2. Extracts Electron
3. Copies your app files
4. Renames electron.exe
5. Creates ZIP package

### Build Time:

- **First build**: 2-5 minutes (downloads Electron)
- **Subsequent**: 30-60 seconds

### Output:

```
dist/
├── CCTV-Surveillance-win32-x64/   ← Portable folder
└── CCTV-Surveillance-v1.0.0-Windows.zip  ← Distributable ZIP
```

## 📊 File Sizes

- **ZIP Package**: 102.5 MB
- **Extracted**: ~220 MB
- **After Installation**: ~1.5 GB (includes Python venv, node_modules, backend, frontend)

## 🎯 What Happens on First Run

```
User runs CCTV Surveillance.exe
  ↓
App checks: Are components installed?
  ├─ Yes → Start app
  └─ No  → Show installation UI
            ↓
         Download from GitHub main branch
            ↓
         Extract to %APPDATA%\CCTV-Surveillance\app\
            ↓
         Create Python virtual environment
            ↓
         Install requirements.txt
            ↓
         Run Django migrations
            ↓
         Install npm packages  
            ↓
         Build React frontend
            ↓
         Start Django backend
            ↓
         Open app window
```

## 🔐 Security Notes

- **Not code-signed**: Windows will show "Unknown publisher" warning
  - Users must click "More info" → "Run anyway"
  - To fix: Get a code signing certificate (~$100-500/year)

- **Antivirus**: May flag unsigned executables
  - False positive
  - Users can add to exceptions

## 📦 Alternative: NSIS Installer

If you need a traditional installer (.exe that installs to Program Files):

1. Install NSIS: https://nsis.sourceforge.io/
2. Use the portable build
3. Create NSIS script
4. Compile installer

Or use: https://www.innosetup.com/

## 🐛 Troubleshooting Builds

### "Cannot find module"
```powershell
cd electron-app
Remove-Item node_modules -Recurse -Force
npm install
```

### "electron-builder fails"
Use the manual build script instead:
```powershell
.\manual-build.ps1
```

### "Build takes forever"
First build downloads Electron (~100MB). Subsequent builds are faster.

### "ZIP too large"
102MB is normal for Electron apps. It includes Chromium.

## 💡 Tips

### Reduce File Size:

- Remove unused locales from `dist/locales/` (saves ~30MB)
- Use electron-builder with `asar` (not implemented yet)
- Remove devDependencies from package.json

### Professional Installer:

- Consider electron-builder NSIS target
- Add auto-updater
- Add code signing
- Add custom icons

### Branding:

- Replace `icon.png` with your logo
- Update `package.json` author/description
- Customize installation UI in `assets/installing.html`

## 📞 Support

### For Users:

Check logs:
```
%APPDATA%\CCTV-Surveillance\logs\app.log
```

### For Developers:

Test build:
```powershell
cd dist\CCTV-Surveillance-win32-x64
."CCTV Surveillance.exe"
```

## ✅ Distribution Checklist

Before releasing:

- [ ] Build works on your machine
- [ ] Test on clean Windows install
- [ ] Prerequisites documented
- [ ] README.txt included
- [ ] Version number updated
- [ ] Tagged in Git
- [ ] Uploaded to GitHub releases
- [ ] Download link tested
- [ ] Installation instructions shared

## 🎉 Success!

You now have:
- ✅ Windows executable application
- ✅ 102MB distributable ZIP file
- ✅ Automatic component installation from GitHub
- ✅ Auto-update capability
- ✅ Professional desktop app

**Ready to distribute!**

Upload to GitHub releases and share the link:
```
https://github.com/bassy1992/cctv-sulellance-software/releases
```

---

**Build Date**: August 26, 2026
**Version**: 1.0.0
**File**: CCTV-Surveillance-v1.0.0-Windows.zip
**Size**: 102.5 MB
