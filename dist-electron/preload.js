import { contextBridge as s, ipcRenderer as e } from "electron";
s.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => e.send("window-minimize"),
  maximize: () => e.send("window-maximize"),
  close: () => e.send("window-close"),
  toggleDevTools: () => e.send("toggle-dev-tools"),
  // Window state listener
  onMaximizeChange: (n) => {
    const i = (o, t) => n(t);
    return e.on("window-maximized-changed", i), () => e.removeListener("window-maximized-changed", i);
  },
  // File operations
  openFileDialog: () => e.invoke("open-file-dialog"),
  selectOutputDir: () => e.invoke("select-output-dir"),
  getFileInfo: (n) => e.invoke("get-file-info", n),
  // Conversion
  convertFiles: (n) => e.invoke("convert-files", n),
  onConversionProgress: (n) => {
    const i = (o, t) => n(t);
    return e.on("conversion-progress", i), () => e.removeListener("conversion-progress", i);
  },
  // Thumbnails
  generateThumbnail: (n) => e.invoke("generate-thumbnail", n),
  // History
  getHistory: (n) => e.invoke("get-history", n),
  getHistoryStats: () => e.invoke("get-history-stats"),
  deleteHistoryItem: (n) => e.invoke("delete-history-item", n),
  clearHistory: () => e.invoke("clear-history"),
  showInFolder: (n) => e.invoke("show-in-folder", n),
  // Settings
  getSettings: () => e.invoke("get-settings"),
  getSetting: (n) => e.invoke("get-setting", n),
  updateSetting: (n, i) => e.invoke("update-setting", n, i),
  resetSettings: () => e.invoke("reset-settings"),
  // Utility
  getAppVersion: () => e.invoke("get-app-version"),
  getAppPath: (n) => e.invoke("get-app-path", n),
  openExternal: (n) => e.invoke("open-external", n)
});
