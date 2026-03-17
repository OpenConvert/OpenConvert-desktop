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

// Image optimization options
interface ImageOptimizationOptions {
    resize?: {
        width?: number
        height?: number
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    }
    rotate?: number // Degrees: 0, 90, 180, 270
    stripMetadata?: boolean
}

// Audio/Video optimization options
interface MediaOptimizationOptions {
    videoBitrate?: string // e.g., '1M', '2M', '5M'
    audioBitrate?: string // e.g., '128k', '192k', '320k'
    resolution?: string // e.g., '1920x1080', '1280x720', '640x480'
    fps?: number // Frames per second
    codec?: {
        video?: string // e.g., 'libx264', 'libx265'
        audio?: string // e.g., 'aac', 'mp3'
    }
}

// File metadata info (dimensions, duration, etc.)
interface FileMetadataInfo {
    width?: number
    height?: number
    duration?: number // seconds
    pageCount?: number
    codec?: string
    bitrate?: number
    format?: string
}

// Metadata types
interface FileMetadata {
    // Common metadata
    title?: string
    artist?: string
    album?: string
    composer?: string
    genre?: string
    date?: string
    description?: string
    comment?: string
    
    // Video-specific
    copyright?: string
    
    // Image-specific
    author?: string
    
    // Thumbnail (for images/videos)
    thumbnail?: string // base64 or path
}

// Conversion types
interface ConvertFilePayload {
    sourcePath: string
    sourceExt: string
    sourceName: string
    sourceSize: number
    targetFormat: string
    fileId: string
    imageOptions?: ImageOptimizationOptions
    mediaOptions?: MediaOptimizationOptions
    metadata?: FileMetadata
}

interface ConvertPayload {
    targetDirectory: string
    filesToConvert: ConvertFilePayload[]
    quality: number
    concurrency: number
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
}

interface ConversionProgressData {
    fileId: string
    progress: number
    status: 'converting' | 'done' | 'error'
    error?: string
    currentOperation?: string // e.g., "Encoding...", "Decoding...", "Processing..."
    eta?: number // Estimated seconds remaining
    startTime?: number // Timestamp when conversion started
}

interface ConversionResult {
    fileId: string
    success: boolean
    outputPath?: string
    error?: string
}

interface ConvertFilesResponse {
    success: boolean
    results: ConversionResult[]
}

// History types
interface HistoryItem {
    id: number
    created_at: number
    source_path: string
    source_name: string
    source_ext: string
    source_size: number
    target_format: string
    output_path: string
    status: 'completed' | 'failed'
    error_message: string | null
    duration_ms: number
}

interface HistoryQueryOptions {
    limit?: number
    offset?: number
    status?: string
    search?: string
}

interface HistoryQueryResult {
    items: HistoryItem[]
    total: number
}

interface HistoryStats {
    total: number
    completed: number
    failed: number
}

// Analytics types
interface AnalyticsData {
    totalConversions: number
    successfulConversions: number
    failedConversions: number
    totalFilesSize: number
    totalDuration: number
    averageDuration: number
    topSourceFormats: Array<{ format: string; count: number }>
    topTargetFormats: Array<{ format: string; count: number }>
    conversionsByCategory: Array<{ category: string; count: number }>
    recentTrend: Array<{ date: string; count: number }>
    fastestConversion: { name: string; duration: number } | null
    slowestConversion: { name: string; duration: number } | null
}

// Electron API
interface ElectronAPI {
    // Drag-and-drop
    getPathForFile: (file: File) => string

    // Window controls
    minimize: () => void
    maximize: () => void
    close: () => void
    toggleDevTools: () => void
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void

    // File operations
    openFileDialog: () => Promise<FileInfo[]>
    openFolderDialog: () => Promise<FileInfo[]>
    selectOutputDir: () => Promise<string | null>
    getFileInfo: (filePath: string) => Promise<FileInfo | null>

    // Conversion
    convertFiles: (payload: ConvertPayload) => Promise<ConvertFilesResponse>
    onConversionProgress: (callback: (data: ConversionProgressData) => void) => () => void

    // Thumbnails & Metadata
    generateThumbnail: (filePath: string) => Promise<string | null>
    getFileMetadata: (filePath: string) => Promise<FileMetadataInfo | null>

    // History
    getHistory: (options: HistoryQueryOptions) => Promise<HistoryQueryResult>
    getHistoryStats: () => Promise<HistoryStats>
    deleteHistoryItem: (id: number) => Promise<boolean>
    clearHistory: () => Promise<number>
    showInFolder: (filePath: string) => Promise<boolean>

    // Analytics
    getAnalytics: () => Promise<AnalyticsData>

    // Settings
    getSettings: () => Promise<Record<string, string>>
    getSetting: (key: string) => Promise<string | null>
    updateSetting: (key: string, value: string) => Promise<boolean>
    resetSettings: () => Promise<boolean>

    // Utility
    getAppVersion: () => Promise<string>
    getAppPath: (name: string) => Promise<string | null>
    openExternal: (url: string) => Promise<boolean>

    // Post-conversion actions
    executePostConversionAction: (action: string, data?: { outputPath?: string }) => Promise<{ success: boolean; error?: string }>

    // Demo support
    getDemoOutputPath: () => Promise<string>
}

interface Window {
    electronAPI: ElectronAPI
}
