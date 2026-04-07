const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// In dev mode, we assume the backend is started via concurrently or separately.
// For production mode, we might want to start the backend directly here.
const isDev = !app.isPackaged;
let backendProcess = null;

function startBackend() {
  const bePath = path.join(__dirname, 'cms-middle-be', 'index.js');
  if (fs.existsSync(bePath)) {
    console.log('[Electron] Starting Backend...', bePath);
    // require(bePath); // Alternatively, you can just require it if it's safe to run in the main process
    backendProcess = spawn('node', [bePath], { cwd: path.join(__dirname, 'cms-middle-be') });
    backendProcess.stdout.on('data', (data) => console.log(`[BE]: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`[BE ERROR]: ${data}`));
  } else {
    console.error('[Electron] Backend index.js not found at', bePath);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    // In dev, load Vite's local server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built React app
    mainWindow.loadFile(path.join(__dirname, 'cms-middle-fe', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (!isDev) {
    // Start backend in production
    startBackend();
  }

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

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});