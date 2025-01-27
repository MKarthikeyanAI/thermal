const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrintCommand: async (data) => {
    try {
      const result = await ipcRenderer.invoke('print', data);
      return result;
    } catch (error) {
      throw error;
    }
  },
});