import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !!process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        backgroundColor: '#0a0a0b',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            devTools: true,
        },
    })

    // Forward maximize/unmaximize state changes to renderer
    mainWindow.on('maximize', () => {
        mainWindow?.webContents.send('window-maximized-changed', true)
    })
    mainWindow.on('unmaximize', () => {
        mainWindow?.webContents.send('window-maximized-changed', false)
    })

    // Clean up reference when window is closed
    mainWindow.on('closed', () => {
        mainWindow = null
    })

    console.log('[main] isDev:', isDev)
    console.log('[main] VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL)

    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
        console.log('[main] Dev server URL loaded.')
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    let devToolsWindow: BrowserWindow | null = null

    ipcMain.removeAllListeners('toggle-dev-tools')
    ipcMain.on('toggle-dev-tools', () => {
        console.log('[main] toggle-dev-tools IPC received')

        if (!mainWindow) return

        if (mainWindow.webContents.isDevToolsOpened()) {
            console.log('[main] Closing DevTools')
            mainWindow.webContents.closeDevTools()
            if (devToolsWindow && !devToolsWindow.isDestroyed()) {
                devToolsWindow.close()
            }
            devToolsWindow = null
        } else {
            console.log('[main] Opening Custom DevTools Window')
            if (!devToolsWindow || devToolsWindow.isDestroyed()) {
                devToolsWindow = new BrowserWindow({
                    width: 800,
                    height: 600,
                    title: "OpenConvert Developer Tools"
                })
                devToolsWindow.on('closed', () => {
                    devToolsWindow = null
                })
            }

            mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents)
            mainWindow.webContents.openDevTools({ mode: 'detach' })
        }
    })
}

app.whenReady().then(createWindow)

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
})
ipcMain.on('window-close', () => mainWindow?.close())

// File dialog
ipcMain.handle('open-file-dialog', async () => {
    if (!mainWindow) return []

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            {
                name: 'Supported Files',
                extensions: [
                    'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'tiff', 'tif', 'svg', 'ico', 'jxl',
                    'pdf', 'epub', 'xps', 'cbz', 'mobi', 'fb2', 'docx', 'txt', 'rtf', 'odt',
                    'mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv', 'wmv',
                    'mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a',
                ],
            },
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'tiff', 'tif', 'svg', 'ico', 'jxl'] },
            { name: 'Documents', extensions: ['pdf', 'epub', 'xps', 'cbz', 'mobi', 'fb2', 'docx', 'txt', 'rtf', 'odt'] },
            { name: 'Video', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv', 'wmv'] },
            { name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    })

    if (result.canceled) return []

    const fileInfos = await Promise.all(
        result.filePaths.map(async (filePath) => {
            const stat = await fs.stat(filePath)
            return {
                path: filePath,
                name: path.basename(filePath),
                ext: path.extname(filePath).slice(1).toLowerCase(),
                size: stat.size,
            }
        })
    )
    return fileInfos
})

// Save dialog for output directory
ipcMain.handle('select-output-dir', async () => {
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
})

// Get file info (for drag & drop)
ipcMain.handle('get-file-info', async (_event, filePath: string) => {
    try {
        const stat = await fs.stat(filePath)
        return {
            path: filePath,
            name: path.basename(filePath),
            ext: path.extname(filePath).slice(1).toLowerCase(),
            size: stat.size,
        }
    } catch {
        return null
    }
})

// Convert files payload receiver
ipcMain.handle('convert-files', async (_event, payload: { targetDirectory: string, filesToConvert: { sourcePath: string, targetFormat: string }[] }) => {
    console.log('[main] Received conversion payload:', JSON.stringify(payload, null, 2))

    // TODO: Implement actual conversion logic here

    // Simulate successful conversion for now
    return { success: true }
})
