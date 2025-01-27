const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrintCommand: (data) => ipcRenderer.invoke('print', data)
});

ipcRenderer.on('print-success', () => {
  // Handle print success in renderer if needed
  console.log('Print job sent successfully.');
});

ipcRenderer.on('print-error', (event, error) => {
  // Handle print error in renderer
  console.error('Print error:', error);
});