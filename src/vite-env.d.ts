/// <reference types="vite/client" />

interface FileInfo {
    path: string
    name: string
    ext: string
    size: number
}

/** Electron File object extends the standard File with a `path` property */
interface ElectronFile extends File {
    path: string
}

interface ElectronAPI {
    minimize: () => void
    maximize: () => void
    close: () => void
    toggleDevTools: () => void
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
    openFileDialog: () => Promise<FileInfo[]>
    selectOutputDir: () => Promise<string | null>
    getFileInfo: (filePath: string) => Promise<FileInfo | null>
}

interface Window {
    electronAPI: ElectronAPI
}
