interface WebUtils {
  getPathForFile: (file: File) => string;
}

interface ElectronAPI {
  // Add your API methods here
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    webUtils: WebUtils;
  }
}

export {};