import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import {
    initDatabase,
    closeDatabase,
    insertConversion,
    getConversions,
    getConversionsByStatus,
    searchConversions,
    deleteConversion,
    clearAllConversions,
    getConversionStats,
    getSetting,
    setSetting,
    getAllSettings,
    resetAllSettings,
} from './database'
import {
    convertImage,
    isImageFormat,
    getConverterCategory,
    generateThumbnail,
} from './converters'

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

app.whenReady().then(() => {
    // Initialize database before creating the window
    initDatabase()
    createWindow()
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Clean up database on quit
app.on('will-quit', () => {
    closeDatabase()
})

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ========================================
// Window controls
// ========================================
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
})
ipcMain.on('window-close', () => mainWindow?.close())

// ========================================
// File dialog
// ========================================
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

// ========================================
// File Conversion
// ========================================

interface ConvertFilePayload {
    sourcePath: string
    sourceExt: string
    sourceName: string
    sourceSize: number
    targetFormat: string
    fileId: string
}

interface ConvertPayload {
    targetDirectory: string
    filesToConvert: ConvertFilePayload[]
    quality: number
    concurrency: number
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
}

/**
 * Process a batch of files with controlled concurrency.
 */
async function processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = []
    const executing = new Set<Promise<void>>()

    for (const item of items) {
        const promise = (async () => {
            const result = await processor(item)
            results.push(result)
        })()

        executing.add(promise)
        promise.finally(() => executing.delete(promise))

        if (executing.size >= concurrency) {
            await Promise.race(executing)
        }
    }

    await Promise.all(executing)
    return results
}

ipcMain.handle('convert-files', async (_event, payload: ConvertPayload) => {
    console.log('[main] Received conversion payload:', JSON.stringify(payload, null, 2))

    const {
        targetDirectory,
        filesToConvert,
        quality = 90,
        concurrency = 3,
        overwriteBehavior = 'rename',
    } = payload

    const results: Array<{
        fileId: string
        success: boolean
        outputPath?: string
        error?: string
    }> = []

    await processWithConcurrency(filesToConvert, concurrency, async (file) => {
        const category = getConverterCategory(file.sourceExt)

        // Send progress: starting
        mainWindow?.webContents.send('conversion-progress', {
            fileId: file.fileId,
            progress: 10,
            status: 'converting',
        })

        let result: { success: boolean; outputPath: string; error?: string; durationMs: number }

        if (category === 'image' && isImageFormat(file.sourceExt)) {
            // Send progress: processing
            mainWindow?.webContents.send('conversion-progress', {
                fileId: file.fileId,
                progress: 30,
                status: 'converting',
            })

            result = await convertImage({
                sourcePath: file.sourcePath,
                outputDir: targetDirectory,
                targetFormat: file.targetFormat,
                quality,
                overwriteBehavior,
            })

            // Send progress: almost done
            mainWindow?.webContents.send('conversion-progress', {
                fileId: file.fileId,
                progress: 90,
                status: 'converting',
            })
        } else if (category === 'document') {
            result = {
                success: false,
                outputPath: '',
                error: 'Document conversion requires Pandoc to be installed. Please install Pandoc (https://pandoc.org) and try again.',
                durationMs: 0,
            }
        } else if (category === 'video') {
            result = {
                success: false,
                outputPath: '',
                error: 'Video conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.',
                durationMs: 0,
            }
        } else if (category === 'audio') {
            result = {
                success: false,
                outputPath: '',
                error: 'Audio conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.',
                durationMs: 0,
            }
        } else {
            result = {
                success: false,
                outputPath: '',
                error: `Unsupported file format: .${file.sourceExt}`,
                durationMs: 0,
            }
        }

        // Save to history database
        try {
            insertConversion({
                created_at: Date.now(),
                source_path: file.sourcePath,
                source_name: file.sourceName,
                source_ext: file.sourceExt,
                source_size: file.sourceSize,
                target_format: file.targetFormat,
                output_path: result.outputPath || '',
                status: result.success ? 'completed' : 'failed',
                error_message: result.error ?? null,
                duration_ms: result.durationMs,
            })
        } catch (dbErr) {
            console.error('[main] Failed to save conversion history:', dbErr)
        }

        // Send final progress
        mainWindow?.webContents.send('conversion-progress', {
            fileId: file.fileId,
            progress: 100,
            status: result.success ? 'done' : 'error',
            error: result.error,
        })

        results.push({
            fileId: file.fileId,
            success: result.success,
            outputPath: result.outputPath,
            error: result.error,
        })
    })

    return { success: true, results }
})

// ========================================
// Thumbnail Generation
// ========================================

ipcMain.handle('generate-thumbnail', async (_event, filePath: string) => {
    try {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        if (!isImageFormat(ext)) return null
        return await generateThumbnail(filePath, 128)
    } catch {
        return null
    }
})

// ========================================
// History
// ========================================

ipcMain.handle('get-history', async (_event, options: { limit?: number; offset?: number; status?: string; search?: string }) => {
    const { limit = 50, offset = 0, status, search } = options

    if (search && search.trim().length > 0) {
        return searchConversions(search.trim(), limit, offset)
    }
    if (status && status !== 'all') {
        return getConversionsByStatus(status, limit, offset)
    }
    return getConversions(limit, offset)
})

ipcMain.handle('get-history-stats', async () => {
    return getConversionStats()
})

ipcMain.handle('delete-history-item', async (_event, id: number) => {
    return deleteConversion(id)
})

ipcMain.handle('clear-history', async () => {
    return clearAllConversions()
})

ipcMain.handle('show-in-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
    return true
})

// ========================================
// Settings
// ========================================

ipcMain.handle('get-settings', async () => {
    return getAllSettings()
})

ipcMain.handle('get-setting', async (_event, key: string) => {
    return getSetting(key)
})

ipcMain.handle('update-setting', async (_event, key: string, value: string) => {
    setSetting(key, value)
    return true
})

ipcMain.handle('reset-settings', async () => {
    resetAllSettings()
    return true
})

// ========================================
// Utility
// ========================================

ipcMain.handle('get-app-version', async () => {
    return app.getVersion()
})

ipcMain.handle('get-app-path', async (_event, name: string) => {
    try {
        return app.getPath(name as Parameters<typeof app.getPath>[0])
    } catch {
        return null
    }
})

ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url)
    return true
})
