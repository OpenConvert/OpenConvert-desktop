import { contextBridge as t, ipcRenderer as e } from "electron";
t.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => e.send("window-minimize"),
  maximize: () => e.send("window-maximize"),
  close: () => e.send("window-close"),
  toggleDevTools: () => e.send("toggle-dev-tools"),
  // Window state listener
  onMaximizeChange: (i) => {
    const n = (d, o) => i(o);
    return e.on("window-maximized-changed", n), () => e.removeListener("window-maximized-changed", n);
  },
  // File operations
  openFileDialog: () => e.invoke("open-file-dialog"),
  selectOutputDir: () => e.invoke("select-output-dir"),
  getFileInfo: (i) => e.invoke("get-file-info", i),
  convertFiles: (i) => e.invoke("convert-files", i)
});
