import React, { useState } from 'react';
import { useCameras } from './hooks/useCameras';
import { useRecordings } from './hooks/useRecordings';
import { useStorage } from './hooks/useStorage';
import { useSettings } from './hooks/useSettings';
import { Sidebar, ActivePage } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import { LiveCameras } from './pages/LiveCameras';
import { Recordings } from './pages/Recordings';
import { Cameras } from './pages/Cameras';
import { Storage } from './pages/Storage';
import { Settings } from './pages/Settings';
import { ToastContainer } from './components/Common/Toast';
import { Camera, Recording } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string }>>([]);
  const [selectedCameraForView, setSelectedCameraForView] = useState<Camera | null>(null);
  const [activePlayingRecording, setActivePlayingRecording] = useState<Recording | null>(null);

  // Hook Data Layers
  const {
    cameras,
    loading: camerasLoading,
    actionLoadingId,
    refreshCameras,
    addCamera,
    updateCamera,
    deleteCamera,
    startRecording,
    stopRecording,
    takeSnapshot,
    testConnection,
    ptzControl
  } = useCameras();

  const {
    recordings,
    totalCount,
    page,
    pageSize,
    totalPages,
    filters,
    loading: recordingsLoading,
    deletingId,
    updateFilters,
    resetFilters,
    deleteRecording,
    refreshRecordings
  } = useRecordings();

  const {
    storage,
    loading: storageLoading,
    error: storageError,
    isUpdating: storageUpdating,
    updateRetention,
    runCleanup,
    refreshStorage
  } = useStorage();

  const {
    settings,
    health,
    events,
    saving: settingsSaving,
    updateSettings,
    resetFactory
  } = useSettings();

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler Wrappers with Toasts
  const handleStartRecording = async (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    try {
      const res = await startRecording(cameraId);
      if (res?.success) {
        addToast('success', `Recording started on ${cam?.name || 'Camera'}. Writing to desktop storage.`);
        refreshStorage();
        refreshRecordings();
      }
      return res;
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to start recording');
      return { success: false };
    }
  };

  const handleStopRecording = async (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    try {
      const res = await stopRecording(cameraId);
      if (res?.success) {
        addToast('info', `Recording saved for ${cam?.name || 'Camera'}. Indexed into vault.`);
        refreshStorage();
        refreshRecordings();
      }
      return res;
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to stop recording');
      return { success: false };
    }
  };

  const handleTakeSnapshot = async (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    try {
      const res = await takeSnapshot(cameraId);
      if (res?.success) {
        addToast('success', `Snapshot captured from ${cam?.name || 'Camera'} and saved to desktop.`);
      }
      return res;
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to take snapshot');
      return { success: false };
    }
  };

  const handleDownloadRecording = async (rec: Recording) => {
    addToast('info', `Preparing download for ${rec.cameraName} clip (${rec.fileSizeMB.toFixed(1)} MB)...`);
    setTimeout(() => {
      const dummyContent = `Tapo TC40 Surveillance Video Clip\nCamera: ${rec.cameraName}\nTimestamp: ${rec.startTime}\nDuration: ${rec.durationSeconds}s\nResolution: ${rec.resolution}\nBitrate: ${rec.bitrateKbps} kbps\nStorage: ${rec.storageFilePath}`;
      const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TAPO_${rec.cameraName.replace(/\s+/g, '_')}_${rec.startTime.replace(/[: ]/g, '-')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', `Clip downloaded: ${a.download}`);
    }, 400);
  };

  const handleDeleteRecordingWithToast = async (id: string) => {
    try {
      await deleteRecording(id);
      addToast('success', 'Recording permanently deleted from desktop drive.');
      refreshStorage();
      return { success: true };
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to delete recording');
      return { success: false };
    }
  };

  const handleUpdateRetentionWithToast = async (days: number) => {
    try {
      const res = await updateRetention(days);
      if (res?.success) {
        addToast('success', `Retention policy updated to ${days} days.`);
        refreshStorage();
        refreshRecordings();
      }
      return res;
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to update retention policy');
      return { success: false };
    }
  };

  const handleCleanupWithToast = async () => {
    try {
      const res = await runCleanup();
      if (res?.success) {
        addToast('success', `Pruned ${res.deletedCount} expired recordings. Reclaimed ${res.freedGB} GB.`);
        refreshStorage();
        refreshRecordings();
      }
      return res;
    } catch (err: any) {
      addToast('error', err?.message || 'Cleanup failed');
      return { success: false };
    }
  };

  const handleSaveSettingsWithToast = async (newSettings: any) => {
    try {
      const updated = await updateSettings(newSettings);
      addToast('success', 'Surveillance system settings saved successfully.');
      return updated;
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save settings');
      return null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0C10] text-[#E0E0E0] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Persistent Surveillance Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        cameras={cameras}
        storage={storage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Header with Live Clock & System Status */}
        <Header health={health} cameras={cameras} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0A0C10] scroll-smooth">
          {activePage === 'dashboard' && (
            <Dashboard
              cameras={cameras}
              recordings={recordings}
              storage={storage}
              health={health}
              events={events}
              onNavigate={(p) => setActivePage(p)}
              onSelectCamera={(cam) => {
                setSelectedCameraForView(cam);
                setActivePage('live');
              }}
              onPlayRecording={(rec) => setActivePlayingRecording(rec)}
              onDownloadRecording={handleDownloadRecording}
            />
          )}

          {activePage === 'live' && (
            <LiveCameras
              cameras={cameras}
              loading={camerasLoading}
              onRefresh={refreshCameras}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onTakeSnapshot={handleTakeSnapshot}
              onPtzControl={ptzControl}
              actionLoadingId={actionLoadingId}
              selectedCamera={selectedCameraForView}
              onSelectCamera={(cam) => setSelectedCameraForView(cam)}
            />
          )}

          {activePage === 'recordings' && (
            <Recordings
              recordings={recordings}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              filters={filters}
              loading={recordingsLoading}
              deletingId={deletingId}
              cameras={cameras}
              onUpdateFilters={updateFilters}
              onResetFilters={resetFilters}
              onDeleteRecording={handleDeleteRecordingWithToast}
              onDownloadRecording={handleDownloadRecording}
              activePlayingRecording={activePlayingRecording}
              onPlayRecording={(rec) => setActivePlayingRecording(rec)}
            />
          )}

          {activePage === 'cameras' && (
            <Cameras
              cameras={cameras}
              loading={camerasLoading}
              onAddCamera={async (data) => {
                const res = await addCamera(data);
                if (res) addToast('success', `Camera "${data.name}" added successfully.`);
              }}
              onUpdateCamera={async (id, data) => {
                const res = await updateCamera(id, data);
                if (res) addToast('success', 'Camera configurations updated.');
              }}
              onDeleteCamera={async (id) => {
                await deleteCamera(id);
                addToast('info', 'Camera detached from surveillance.');
              }}
              onTestConnection={testConnection}
              onRefresh={refreshCameras}
            />
          )}

          {activePage === 'storage' && (
            <Storage
              storage={storage}
              loading={storageLoading}
              error={storageError}
              onRefresh={refreshStorage}
              onUpdateRetention={handleUpdateRetentionWithToast}
              onRunCleanup={handleCleanupWithToast}
              isUpdating={storageUpdating}
            />
          )}

          {activePage === 'settings' && (
            <Settings
              settings={settings}
              cameras={cameras}
              onSaveSettings={handleSaveSettingsWithToast}
              onResetSettings={async () => {
                resetFactory();
                addToast('info', 'Settings reset to defaults.');
              }}
              isSaving={settingsSaving}
            />
          )}
        </main>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
