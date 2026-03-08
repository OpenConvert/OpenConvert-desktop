import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    // Drag-and-drop file path getter (modern Electron approach)
    getPathForFile: (file: File) => webUtils.getPathForFile(file),

    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),

    // Window state listener
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
        ipcRenderer.on('window-maximized-changed', handler)
        return () => ipcRenderer.removeListener('window-maximized-changed', handler)
    },

    // File operations
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
    getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),

    // Conversion
    convertFiles: (payload: ConvertPayload) => ipcRenderer.invoke('convert-files', payload),
    onConversionProgress: (callback: (data: ConversionProgressData) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: ConversionProgressData) => callback(data)
        ipcRenderer.on('conversion-progress', handler)
        return () => ipcRenderer.removeListener('conversion-progress', handler)
    },

    // Thumbnails
    generateThumbnail: (filePath: string) => ipcRenderer.invoke('generate-thumbnail', filePath),

    // History
    getHistory: (options: HistoryQueryOptions) => ipcRenderer.invoke('get-history', options),
    getHistoryStats: () => ipcRenderer.invoke('get-history-stats'),
    deleteHistoryItem: (id: number) => ipcRenderer.invoke('delete-history-item', id),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),

    // Analytics
    getAnalytics: () => ipcRenderer.invoke('get-analytics'),

    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
    updateSetting: (key: string, value: string) => ipcRenderer.invoke('update-setting', key, value),
    resetSettings: () => ipcRenderer.invoke('reset-settings'),

    // Utility
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
})

// Type definitions for the preload script
interface ConvertPayload {
    targetDirectory: string
    filesToConvert: Array<{
        sourcePath: string
        sourceExt: string
        sourceName: string
        sourceSize: number
        targetFormat: string
        fileId: string
    }>
    quality: number
    concurrency: number
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
}

interface ConversionProgressData {
    fileId: string
    progress: number
    status: 'converting' | 'done' | 'error'
    error?: string
}

interface HistoryQueryOptions {
    limit?: number
    offset?: number
    status?: string
    search?: string
}
