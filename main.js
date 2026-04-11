const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// console.log('Dev server URL:', process.env.VITE_DEV_SERVER_URL); // Vite tự inject
// console.log('process.env.VITE_HOST', process.env.VITE_HOST);
// console.log('process.env.VITE_PORT', process.env.VITE_PORT);

const os = require('os');

const SKIP_KEYWORDS = ['Tailscale', 'vEthernet', 'Loopback', 'VMware', 'VirtualBox', 'Pseudo'];

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (SKIP_KEYWORDS.some(kw => name.includes(kw))) continue;
    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }

  if (candidates.length === 0) return '127.0.0.1';

  // Ưu tiên Ethernet thực > Wi-Fi > còn lại
  const preferred =
    candidates.find(c => /ethernet/i.test(c.name) && !/vethernet/i.test(c.name)) ||
    candidates.find(c => /wi.fi|wlan|wireless/i.test(c.name)) ||
    candidates[0];

  return preferred?.address || '127.0.0.1';
}

console.log(`[Electron] Local IP: ${getLocalIP()}`);

// In dev mode, we assume the backend is started via concurrently or separately.
// For production mode, we might want to start the backend directly here.
const isDev = !app.isPackaged;
let backendProcess = null;

function startBackend() {
  const osPlatform = os.platform();
  const beExecutableName = osPlatform === 'win32' ? 'cms-ai-vms-middle.exe' : 'cms-ai-vms-middle';

  const binaryPath = isDev
    ? path.join(__dirname, 'build-be', beExecutableName)
    : path.join(process.resourcesPath, 'bin', beExecutableName);

  if (fs.existsSync(binaryPath)) {
    console.log('[Electron] Starting Backend Sidecar...', binaryPath);
    backendProcess = spawn(binaryPath, [], { cwd: path.dirname(binaryPath) });
    backendProcess.stdout.on('data', (data) => console.log(`[BE]: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`[BE ERROR]: ${data}`));
  } else {
    console.error('[Electron] Backend sidecar not found at', binaryPath);
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