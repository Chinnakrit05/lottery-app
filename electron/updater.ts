import { BrowserWindow, ipcMain, app } from 'electron';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';
import { autoUpdater } from 'electron-updater';

const isDev = process.env.NODE_ENV === 'development';

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'none' | 'downloading' | 'ready' | 'error';
  version?: string;
  percent?: number;       // 0..100
  bytesPerSecond?: number;
  message?: string;
}

let lastStatus: UpdateStatus = { state: 'idle', version: app.getVersion() };

function broadcast(win: BrowserWindow, status: UpdateStatus) {
  lastStatus = status;
  if (win && !win.isDestroyed()) {
    win.webContents.send('update:status', status);
  }
}

/**
 * Register IPC handlers ASAP — the renderer (sidebar) calls these on mount,
 * before the auto-updater is fully set up.
 * Safe to call before any BrowserWindow exists.
 */
export function registerUpdaterIpc() {
  ipcMain.handle('update:getStatus', () => lastStatus);
  ipcMain.handle('update:check', async () => {
    if (isDev || process.platform !== 'win32') {
      return { ok: false, error: 'Auto-update only supported in production Windows' };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, version: result?.updateInfo?.version ?? null };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });
  ipcMain.handle('update:restartAndInstall', () => {
    if (isDev || process.platform !== 'win32') return;
    autoUpdater.quitAndInstall(false, true);
  });
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Don't run in dev — there's no release feed to check against
  if (isDev) return;

  // Windows-only for now (macOS needs code-signing)
  if (process.platform !== 'win32') {
    console.log('[updater] Auto-update disabled on non-Windows platforms');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;

  autoUpdater.on('checking-for-update', () => {
    broadcast(mainWindow, { state: 'checking' });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    broadcast(mainWindow, { state: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    broadcast(mainWindow, { state: 'none', version: app.getVersion() });
  });

  autoUpdater.on('download-progress', (p: ProgressInfo) => {
    broadcast(mainWindow, {
      state: 'downloading',
      percent: Math.round(p.percent),
      bytesPerSecond: Math.round(p.bytesPerSecond),
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    broadcast(mainWindow, { state: 'ready', version: info.version });
  });

  autoUpdater.on('error', (err: Error) => {
    console.error('[updater] error:', err);
    broadcast(mainWindow, { state: 'error', message: err.message });
  });

  // (IPC handlers already registered via registerUpdaterIpc())

  // Auto-check on startup (delay so the UI has time to mount)
  setTimeout(() => {
    autoUpdater
      .checkForUpdates()
      .catch((err: Error) => console.error('[updater] checkForUpdates failed:', err));
  }, 5000);

  // And every 30 minutes after that
  setInterval(() => {
    autoUpdater
      .checkForUpdates()
      .catch((err: Error) => console.error('[updater] periodic check failed:', err));
  }, 30 * 60 * 1000);
}
