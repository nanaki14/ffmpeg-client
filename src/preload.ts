const { contextBridge, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add your API methods here
});

contextBridge.exposeInMainWorld('webUtils', {
  getPathForFile: (file: File): string => {
    return webUtils.getPathForFile(file);
  },
});
