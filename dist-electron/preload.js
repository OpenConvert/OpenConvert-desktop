import { contextBridge, ipcRenderer, webUtils } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Drag-and-drop file path getter (modern Electron approach)
  getPathForFile: (file) => webUtils.getPathForFile(file),
  // Window controls
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  toggleDevTools: () => ipcRenderer.send("toggle-dev-tools"),
  // Window state listener
  onMaximizeChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window-maximized-changed", handler);
    return () => ipcRenderer.removeListener("window-maximized-changed", handler);
  },
  // File operations
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  selectOutputDir: () => ipcRenderer.invoke("select-output-dir"),
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath),
  // Conversion
  convertFiles: (payload) => ipcRenderer.invoke("convert-files", payload),
  onConversionProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("conversion-progress", handler);
    return () => ipcRenderer.removeListener("conversion-progress", handler);
  },
  // Thumbnails
  generateThumbnail: (filePath) => ipcRenderer.invoke("generate-thumbnail", filePath),
  // History
  getHistory: (options) => ipcRenderer.invoke("get-history", options),
  getHistoryStats: () => ipcRenderer.invoke("get-history-stats"),
  deleteHistoryItem: (id) => ipcRenderer.invoke("delete-history-item", id),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),
  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  updateSetting: (key, value) => ipcRenderer.invoke("update-setting", key, value),
  resetSettings: () => ipcRenderer.invoke("reset-settings"),
  // Utility
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: (name) => ipcRenderer.invoke("get-app-path", name),
  openExternal: (url) => ipcRenderer.invoke("open-external", url)
});
