import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import serve from 'electron-serve';
import { initDatabase, closeDatabase } from './db/connection';
import { registerIpcHandlers } from './handlers';
import { createSplashWindow } from './splash';
import { setupAutoUpdater } from './updater';

const isDev = process.env.NODE_ENV === 'development';

// In production, serve the Next.js static export via the app:// protocol.
const loadAppShell = !isDev
  ? serve({ directory: path.join(__dirname, '../out') })
  : null;

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'LotteryApp',
    backgroundColor: '#0b0b0c',
    show: false, // keep hidden until renderer is ready, splash is visible in the meantime
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow?.show();
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      // Start auto-updater after main window is visible (so it can receive events)
      if (mainWindow) setupAutoUpdater(mainWindow);
    }, 400);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[renderer] did-fail-load: ${code} ${desc} ${url}`);
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:3033');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await loadAppShell!(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // 1) Show splash immediately
  splashWindow = createSplashWindow();

  // 2) Do heavy work behind the splash
  initDatabase();
  registerIpcHandlers();

  // 3) Build main window — when ready, it will close the splash
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDatabase();
});
