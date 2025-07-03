import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Add your API methods here
});
