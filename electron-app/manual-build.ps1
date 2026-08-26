# Manual Electron App Builder
# This script packages the Electron app without electron-builder

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CCTV Surveillance - Manual Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paths
$rootDir = $PSScriptRoot
$distDir = Join-Path $rootDir "dist"
$appDir = Join-Path $distDir "CCTV-Surveillance-win32-x64"

# Clean dist
if (Test-Path $distDir) {
    Write-Host "Cleaning dist directory..." -ForegroundColor Yellow
    Remove-Item $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir | Out-Null

# Download Electron
Write-Host "Downloading Electron 28.3.3..." -ForegroundColor Green
$electronUrl = "https://github.com/electron/electron/releases/download/v28.3.3/electron-v28.3.3-win32-x64.zip"
$electronZip = Join-Path $distDir "electron.zip"

Invoke-WebRequest -Uri $electronUrl -OutFile $electronZip -UseBasicParsing
Write-Host "Downloaded Electron" -ForegroundColor Green

# Extract Electron
Write-Host "Extracting Electron..." -ForegroundColor Green
Expand-Archive -Path $electronZip -DestinationPath $appDir -Force
Remove-Item $electronZip

# Create app.asar directory
$resourcesDir = Join-Path $appDir "resources"
$appAsarDir = Join-Path $resourcesDir "app"
New-Item -ItemType Directory -Path $appAsarDir -Force | Out-Null

# Copy app files
Write-Host "Copying application files..." -ForegroundColor Green
$filesToCopy = @(
    "main.js",
    "preload.js",
    "installer.js",
    "package.json",
    "icon.png"
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $rootDir $file
    if (Test-Path $source) {
        Copy-Item $source -Destination $appAsarDir
    }
}

# Copy assets folder
$assetsSource = Join-Path $rootDir "assets"
$assetsDest = Join-Path $appAsarDir "assets"
if (Test-Path $assetsSource) {
    Copy-Item $assetsSource -Destination $assetsDest -Recurse
}

# Rename electron.exe to CCTV Surveillance.exe
$electronExe = Join-Path $appDir "electron.exe"
$appExe = Join-Path $appDir "CCTV Surveillance.exe"
if (Test-Path $electronExe) {
    Rename-Item $electronExe -NewName "CCTV Surveillance.exe"
}

# Create launcher script
$launcherScript = @"
@echo off
start "" "%~dp0CCTV Surveillance.exe"
"@
$launcherPath = Join-Path $appDir "Launch CCTV Surveillance.bat"
$launcherScript | Out-File -FilePath $launcherPath -Encoding ASCII

# Create README
$readme = @"
CCTV Surveillance v1.0.0

To run the application:
1. Double-click "CCTV Surveillance.exe" or "Launch CCTV Surveillance.bat"
2. On first launch, the app will download and install components from GitHub

Prerequisites:
- Python 3.10+ (with pip)
- Node.js 18+
- FFmpeg

For more information, visit:
https://github.com/bassy1992/cctv-sulellance-software
"@
$readmePath = Join-Path $appDir "README.txt"
$readme | Out-File -FilePath $readmePath -Encoding UTF8

# Create ZIP package
Write-Host "Creating ZIP package..." -ForegroundColor Green
$zipPath = Join-Path $distDir "CCTV-Surveillance-v1.0.0-Windows.zip"
Compress-Archive -Path $appDir -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output files:" -ForegroundColor Cyan
Write-Host "  Portable: $appDir" -ForegroundColor White
Write-Host "  ZIP:      $zipPath" -ForegroundColor White
Write-Host ""
Write-Host "File size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "To distribute:" -ForegroundColor Yellow
Write-Host "  1. Upload the ZIP file to GitHub Releases"
Write-Host "  2. Users extract and run 'CCTV Surveillance.exe'"
Write-Host ""
