import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Window state listener
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
        ipcRenderer.on('window-maximized-changed', handler)
        // Return cleanup function
        return () => ipcRenderer.removeListener('window-maximized-changed', handler)
    },

    // File operations
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
    getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
})
