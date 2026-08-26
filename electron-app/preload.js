const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, message) => callback(message));
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  
  // Installation
  onInstallProgress: (callback) => {
    ipcRenderer.on('install-progress', (event, progress) => callback(progress));
  },
  
  // System
  openLogs: () => ipcRenderer.invoke('open-logs'),
  restartApp: () => ipcRenderer.invoke('restart-app')
});
