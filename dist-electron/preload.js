import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
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
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath)
});
