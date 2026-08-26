const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const installer = require('./installer');

// Keep a global reference of the window object
let mainWindow;
let backendProcess = null;
let frontendProcess = null;

// Configuration
const isDev = process.argv.includes('--dev');
const appDataPath = path.join(app.getPath('appData'), 'CCTV-Surveillance');
const installPath = path.join(appDataPath, 'app');
const logsPath = path.join(appDataPath, 'logs');

// Ensure directories exist
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

// Logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  const logFile = path.join(logsPath, 'app.log');
  fs.appendFileSync(logFile, logMessage);
}

// Auto-updater configuration
autoUpdater.logger = {
  info: log,
  warn: log,
  error: log
};

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Check for updates
function checkForUpdates() {
  if (isDev) {
    log('Development mode: Skipping update check');
    return;
  }
  
  autoUpdater.checkForUpdates().catch(err => {
    log(`Update check failed: ${err.message}`);
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  log('Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'Checking for updates...');
  }
});

autoUpdater.on('update-available', (info) => {
  log(`Update available: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    buttons: ['Download', 'Later'],
    defaultId: 0
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  log('No updates available');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'App is up to date');
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const message = `Downloaded ${Math.round(progressObj.percent)}%`;
  log(message);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log('Update downloaded');
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The app will restart to install.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then(result => {
    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
});

autoUpdater.on('error', (err) => {
  log(`Update error: ${err.message}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

// Start Backend (Django)
function startBackend() {
  return new Promise((resolve, reject) => {
    log('Starting Django backend...');
    
    const backendPath = path.join(installPath, 'backend');
    const pythonExe = path.join(backendPath, 'venv', 'Scripts', 'python.exe');
    const managePy = path.join(backendPath, 'manage.py');
    
    if (!fs.existsSync(pythonExe) || !fs.existsSync(managePy)) {
      const error = 'Backend not installed properly';
      log(error);
      reject(new Error(error));
      return;
    }
    
    backendProcess = spawn(pythonExe, [managePy, 'runserver', '127.0.0.1:8000'], {
      cwd: backendPath,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    backendProcess.stdout.on('data', (data) => {
      log(`Backend: ${data.toString().trim()}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      log(`Backend: ${data.toString().trim()}`);
    });
    
    backendProcess.on('error', (err) => {
      log(`Backend error: ${err.message}`);
      reject(err);
    });
    
    backendProcess.on('close', (code) => {
      log(`Backend process exited with code ${code}`);
    });
    
    // Wait for backend to be ready
    setTimeout(() => {
      log('Backend started');
      resolve();
    }, 5000);
  });
}

// Start Frontend (React dev server or serve build)
function startFrontend() {
  return new Promise((resolve, reject) => {
    log('Starting React frontend...');
    
    const frontendPath = path.join(installPath, 'frontend');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    if (!fs.existsSync(frontendPath)) {
      const error = 'Frontend not installed properly';
      log(error);
      reject(new Error(error));
      return;
    }
    
    // For production, we'll serve the built files via Django static
    // For now, just resolve immediately
    log('Frontend configured to load from Django static files');
    resolve();
  });
}

// Stop processes
function stopProcesses() {
  if (backendProcess) {
    log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (frontendProcess) {
    log('Stopping frontend...');
    frontendProcess.kill();
    frontendProcess = null;
  }
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    autoHideMenuBar: true,
    show: false
  });
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Window shown');
  });
  
  // Window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  return mainWindow;
}

// Initialize app
async function initializeApp() {
  try {
    log('Initializing application...');
    
    // Check if app is installed
    const isInstalled = fs.existsSync(path.join(installPath, 'backend')) && 
                        fs.existsSync(path.join(installPath, 'frontend'));
    
    if (!isInstalled) {
      log('App not installed, starting installation...');
      
      // Show installation window
      const installWindow = createWindow();
      installWindow.loadFile(path.join(__dirname, 'assets', 'installing.html'));
      
      // Install app components
      await installer.install(installPath, (progress) => {
        log(`Installation progress: ${progress.message} (${progress.percent}%)`);
        installWindow.webContents.send('install-progress', progress);
      });
      
      log('Installation complete');
      installWindow.close();
    }
    
    // Start backend and frontend
    await startBackend();
    await startFrontend();
    
    // Create and load main window
    createWindow();
    mainWindow.loadURL('http://127.0.0.1:8000/');
    
    log('Application initialized successfully');
    
    // Check for updates after 5 seconds
    setTimeout(() => {
      checkForUpdates();
    }, 5000);
    
  } catch (error) {
    log(`Initialization error: ${error.message}`);
    
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to start the application:\n\n${error.message}\n\nCheck logs at: ${logsPath}`
    );
    
    app.quit();
  }
}

// App events
app.on('ready', () => {
  log('App ready');
  initializeApp();
});

app.on('window-all-closed', () => {
  stopProcesses();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  log('App quitting...');
  stopProcesses();
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { message: 'Development mode: Updates disabled' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    installPath: installPath,
    logsPath: logsPath,
    dataPath: appDataPath
  };
});

ipcMain.handle('open-logs', () => {
  shell.openPath(logsPath);
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.quit();
});

// Error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
});
