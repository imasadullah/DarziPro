import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { AppDataSource } from './config/data-source';
import { registerAuthIPCHandlers } from './ipc/auth.ipc';
import { registerSystemIPCHandlers } from './ipc/system.ipc';
import { registerCustomerIPCHandlers } from './ipc/customer.ipc';
import { registerMeasurementIPCHandlers } from './ipc/measurement.ipc';

let mainWindow: BrowserWindow | null = null;

async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('SQLite Database connection initialized.');
  } catch (error) {
    console.error('TypeORM Database connection failed to initialize:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1280,
    minHeight: 800,
    title: 'Darzi Pro',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Register IPC Routing Listeners
  registerAuthIPCHandlers();
  registerSystemIPCHandlers();
  registerCustomerIPCHandlers();
  registerMeasurementIPCHandlers();

  const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // Attempt standard browser output subfolder from angular builder
    const pathBrowser = path.join(__dirname, '../renderer/browser/index.html');
    mainWindow.loadFile(pathBrowser).catch(() => {
      const pathRoot = path.join(__dirname, '../renderer/index.html');
      mainWindow?.loadFile(pathRoot);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
