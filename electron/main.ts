import { app, BrowserWindow, ipcMain, dialog, shell, Notification } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
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
    getAnalytics,
} from './database'
import {
    convertImage,
    isImageFormat,
    convertVideo,
    isVideoFormat,
    convertAudio,
    isAudioFormat,
    convertDocument,
    isDocumentFormat,
    getConverterCategory,
    generateImageThumbnail,
    generateVideoThumbnail,
    generateAudioThumbnail,
    generateDocumentThumbnail,
    getImageMetadata,
    getVideoMetadata,
    getAudioMetadata,
    getDocumentMetadata,
} from './converters'
import { getFileDialogFilters, isFormatSupported } from './config/formats'
import { getExamplesPath, getDemoOutputPath } from './utils/paths'

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

    // Try to open examples folder by default, fallback to home directory
    const examplesPath = getExamplesPath()
    let defaultPath = app.getPath('home')
    
    try {
        const examplesExists = await fs.stat(examplesPath).then(() => true).catch(() => false)
        if (examplesExists) {
            defaultPath = examplesPath
        }
    } catch (error) {
        console.log('Examples folder not found, using home directory')
    }

    const result = await dialog.showOpenDialog(mainWindow, {
        defaultPath: defaultPath,
        properties: ['openFile', 'multiSelections'],
        filters: getFileDialogFilters(),
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

// Folder dialog with recursive file scanning
ipcMain.handle('open-folder-dialog', async () => {
    if (!mainWindow) return []

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    })

    if (result.canceled) return []

    const folderPath = result.filePaths[0]
    const fileInfos: Array<{ path: string; name: string; ext: string; size: number }> = []

    // Recursive function to scan directory
    async function scanDirectory(dirPath: string) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)
            
            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                await scanDirectory(fullPath)
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).slice(1).toLowerCase()
                
                // Check if file format is supported
                if (isFormatSupported(ext)) {
                    const stat = await fs.stat(fullPath)
                    fileInfos.push({
                        path: fullPath,
                        name: entry.name,
                        ext,
                        size: stat.size,
                    })
                }
            }
        }
    }

    try {
        await scanDirectory(folderPath)
    } catch (err) {
        console.error('[main] Failed to scan directory:', err)
    }

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

interface ImageOptimizationOptions {
    resize?: {
        width?: number
        height?: number
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    }
    rotate?: number
    stripMetadata?: boolean
}

interface MediaOptimizationOptions {
    videoBitrate?: string
    audioBitrate?: string
    resolution?: string
    fps?: number
    codec?: {
        video?: string
        audio?: string
    }
}

interface ConvertFilePayload {
    sourcePath: string
    sourceExt: string
    sourceName: string
    sourceSize: number
    targetFormat: string
    fileId: string
    imageOptions?: ImageOptimizationOptions
    mediaOptions?: MediaOptimizationOptions
    metadata?: Record<string, string>
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
        const startTime = Date.now()

        // Determine output directory: if "same as source", use the source file's directory
        const outputDir = targetDirectory === '__same_as_source__' 
            ? path.dirname(file.sourcePath)
            : targetDirectory

        // Send progress: starting
        mainWindow?.webContents.send('conversion-progress', {
            fileId: file.fileId,
            progress: 10,
            status: 'converting',
            currentOperation: 'Initializing...',
            startTime,
        })

        let result: { success: boolean; outputPath: string; error?: string; durationMs: number }

        if (category === 'image' && isImageFormat(file.sourceExt)) {
            // Send progress: processing
            mainWindow?.webContents.send('conversion-progress', {
                fileId: file.fileId,
                progress: 30,
                status: 'converting',
                currentOperation: 'Processing image...',
                startTime,
            })

            result = await convertImage({
                sourcePath: file.sourcePath,
                outputDir: outputDir,
                targetFormat: file.targetFormat,
                quality,
                overwriteBehavior,
                optimizations: file.imageOptions,
            })

            // Send progress: almost done
            mainWindow?.webContents.send('conversion-progress', {
                fileId: file.fileId,
                progress: 90,
                status: 'converting',
                currentOperation: 'Finalizing...',
                startTime,
            })
        } else if (category === 'video' && isVideoFormat(file.sourceExt)) {
            // Video conversion with progress tracking
            result = await convertVideo({
                sourcePath: file.sourcePath,
                outputDir: outputDir,
                targetFormat: file.targetFormat,
                quality,
                overwriteBehavior,
                metadata: file.metadata as Record<string, string> | undefined,
                onProgress: (percent) => {
                    const elapsed = (Date.now() - startTime) / 1000 // seconds
                    const eta = percent > 0 ? Math.round((elapsed / percent) * (100 - percent)) : 0
                    
                    mainWindow?.webContents.send('conversion-progress', {
                        fileId: file.fileId,
                        progress: percent,
                        status: 'converting',
                        currentOperation: 'Encoding video...',
                        eta,
                        startTime,
                    })
                },
            })
        } else if (category === 'audio' && isAudioFormat(file.sourceExt)) {
            // Audio conversion with progress tracking
            result = await convertAudio({
                sourcePath: file.sourcePath,
                outputDir: outputDir,
                targetFormat: file.targetFormat,
                quality,
                overwriteBehavior,
                metadata: file.metadata,
                onProgress: (percent) => {
                    const elapsed = (Date.now() - startTime) / 1000 // seconds
                    const eta = percent > 0 ? Math.round((elapsed / percent) * (100 - percent)) : 0
                    
                    mainWindow?.webContents.send('conversion-progress', {
                        fileId: file.fileId,
                        progress: percent,
                        status: 'converting',
                        currentOperation: 'Encoding audio...',
                        eta,
                        startTime,
                    })
                },
            })
        } else if (category === 'document' && isDocumentFormat(file.sourceExt)) {
            // Document conversion (no progress tracking available from Pandoc)
            mainWindow?.webContents.send('conversion-progress', {
                fileId: file.fileId,
                progress: 50,
                status: 'converting',
                currentOperation: 'Converting document...',
                startTime,
            })

            result = await convertDocument({
                sourcePath: file.sourcePath,
                outputDir: outputDir,
                targetFormat: file.targetFormat,
                quality,
                overwriteBehavior,
            })
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
        
        // Try image thumbnail first
        if (isImageFormat(ext)) {
            return await generateImageThumbnail(filePath, 128)
        }
        
        // Try video thumbnail
        if (isVideoFormat(ext)) {
            return await generateVideoThumbnail(filePath, 128)
        }
        
        // Try audio waveform
        if (isAudioFormat(ext)) {
            return await generateAudioThumbnail(filePath, 128)
        }
        
        // Try document thumbnail (PDF)
        if (isDocumentFormat(ext)) {
            return await generateDocumentThumbnail(filePath, 128)
        }
        
        return null
    } catch {
        return null
    }
})

// ========================================
// File Metadata
// ========================================

ipcMain.handle('get-file-metadata', async (_event, filePath: string) => {
    try {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        
        if (isImageFormat(ext)) {
            return await getImageMetadata(filePath)
        }
        
        if (isVideoFormat(ext)) {
            return await getVideoMetadata(filePath)
        }
        
        if (isAudioFormat(ext)) {
            return await getAudioMetadata(filePath)
        }
        
        if (isDocumentFormat(ext)) {
            return await getDocumentMetadata(filePath)
        }
        
        return null
    } catch (err) {
        console.error('[main] Failed to get file metadata:', err)
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

ipcMain.handle('get-analytics', async () => {
    return getAnalytics()
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

// ========================================
// Post-Conversion Actions
// ========================================

ipcMain.handle('execute-post-conversion-action', async (_event, action: string, data?: { outputPath?: string }) => {
    try {
        switch (action) {
            case 'notification': {
                // Send desktop notification
                const notification = new Notification({
                    title: 'Conversion Complete',
                    body: 'All files have been successfully converted!',
                    icon: path.join(__dirname, '../logo.ico'),
                })
                notification.show()
                break
            }

            case 'open-folder': {
                // Open the output folder
                if (data?.outputPath) {
                    shell.showItemInFolder(data.outputPath)
                }
                break
            }

            case 'shutdown': {
                // Shutdown the computer
                const platform = process.platform
                try {
                    if (platform === 'win32') {
                        await execAsync('shutdown /s /t 5')
                    } else if (platform === 'darwin') {
                        await execAsync('sudo shutdown -h +1')
                    } else if (platform === 'linux') {
                        await execAsync('shutdown -h +1')
                    }
                } catch (error) {
                    console.error('Failed to shutdown:', error)
                    throw new Error('Failed to initiate shutdown')
                }
                break
            }

            case 'none':
            default:
                // Do nothing
                break
        }
        return { success: true }
    } catch (error) {
        console.error('Post-conversion action failed:', error)
        return { success: false, error: String(error) }
    }
})

// ========================================
// Demo Support
// ========================================

ipcMain.handle('get-demo-output-path', async () => {
    return getDemoOutputPath()
})
