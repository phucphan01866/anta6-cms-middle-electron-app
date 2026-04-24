const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getLocalIP: () => ipcRenderer.sendSync('get-local-ip')
});
