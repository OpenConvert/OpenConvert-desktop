/**
 * ============================================================================
 * OPENCONVERT SUPPORTED FILE FORMATS CONFIGURATION
 * ============================================================================
 * 
 * This file is the single source of truth for all supported file formats.
 * 
 * To add support for a new format:
 * 1. Add the format to the appropriate category in FORMAT_MAP
 * 2. Specify which formats it can be converted to in the 'targets' array
 * 3. The format will automatically appear in file dialogs and UI
 * 
 * Current implementation status:
 * - ✅ Images: Fully supported via Sharp library (built-in)
 * - ✅ Documents: Supported via Pandoc (requires external installation)
 * - ✅ Video: Supported via FFmpeg (requires external installation)
 * - ✅ Audio: Supported via FFmpeg (requires external installation)
 * ============================================================================
 */

export type FileCategory = 'image' | 'document' | 'video' | 'audio'

export interface FormatInfo {
    category: FileCategory
    label: string
    targets: string[]
    description?: string
}

/**
 * Complete format registry
 * Each format maps to its category, display label, and conversion targets
 */
export const FORMAT_MAP: Record<string, FormatInfo> = {
    // ========================================
    // IMAGE FORMATS (✅ SUPPORTED)
    // ========================================
    png: { 
        category: 'image', 
        label: 'PNG', 
        targets: ['jpg', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'],
        description: 'Portable Network Graphics - lossless compression with transparency'
    },
    jpg: { 
        category: 'image', 
        label: 'JPEG', 
        targets: ['png', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'],
        description: 'Joint Photographic Experts Group - lossy compression, widely supported'
    },
    jpeg: { 
        category: 'image', 
        label: 'JPEG', 
        targets: ['png', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'] 
    },
    gif: { 
        category: 'image', 
        label: 'GIF', 
        targets: ['png', 'jpg', 'webp', 'bmp', 'avif', 'tiff'],
        description: 'Graphics Interchange Format - supports animation and transparency'
    },
    webp: { 
        category: 'image', 
        label: 'WebP', 
        targets: ['png', 'jpg', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'],
        description: 'Modern web format - superior compression, supports transparency and animation'
    },
    bmp: { 
        category: 'image', 
        label: 'BMP', 
        targets: ['png', 'jpg', 'webp', 'gif', 'avif', 'tiff'],
        description: 'Bitmap - uncompressed, large file sizes'
    },
    avif: { 
        category: 'image', 
        label: 'AVIF', 
        targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'tiff'],
        description: 'AV1 Image File Format - best compression, modern browsers only'
    },
    tiff: { 
        category: 'image', 
        label: 'TIFF', 
        targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'avif'],
        description: 'Tagged Image File Format - high quality, used in professional photography'
    },
    tif: { 
        category: 'image', 
        label: 'TIFF', 
        targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'avif'] 
    },
    svg: { 
        category: 'image', 
        label: 'SVG', 
        targets: ['png', 'jpg', 'webp'],
        description: 'Scalable Vector Graphics - can be rasterized to PNG/JPG/WebP'
    },
    ico: { 
        category: 'image', 
        label: 'ICO', 
        targets: ['png', 'jpg', 'webp'],
        description: 'Icon format - typically 16x16, 32x32, or 256x256'
    },
    jxl: { 
        category: 'image', 
        label: 'JXL', 
        targets: ['png', 'jpg', 'webp'],
        description: 'JPEG XL - next-gen format with excellent compression'
    },

    // ========================================
    // DOCUMENT FORMATS (✅ SUPPORTED VIA PANDOC)
    // Note: PDF as input is NOT supported by Pandoc
    // ========================================
    pdf: { 
        category: 'document', 
        label: 'PDF', 
        targets: ['png', 'jpg', 'txt'],
        description: 'Portable Document Format - universal document standard'
    },
    epub: { 
        category: 'document', 
        label: 'EPUB', 
        targets: ['pdf', 'txt'],
        description: 'Electronic Publication - ebook format'
    },
    docx: { 
        category: 'document', 
        label: 'DOCX', 
        targets: ['pdf', 'txt'],
        description: 'Microsoft Word Open XML Document'
    },
    txt: { 
        category: 'document', 
        label: 'TXT', 
        targets: ['pdf'],
        description: 'Plain text file'
    },
    rtf: { 
        category: 'document', 
        label: 'RTF', 
        targets: ['pdf', 'txt'],
        description: 'Rich Text Format - cross-platform formatted text'
    },
    odt: { 
        category: 'document', 
        label: 'ODT', 
        targets: ['pdf', 'txt'],
        description: 'OpenDocument Text - open standard document format'
    },
    xps: { 
        category: 'document', 
        label: 'XPS', 
        targets: ['pdf', 'png', 'jpg'],
        description: 'XML Paper Specification - Microsoft document format'
    },
    cbz: { 
        category: 'document', 
        label: 'CBZ', 
        targets: ['pdf', 'png'],
        description: 'Comic Book Archive - ZIP compressed images'
    },
    mobi: { 
        category: 'document', 
        label: 'MOBI', 
        targets: ['pdf', 'epub', 'txt'],
        description: 'Mobipocket eBook - Kindle format'
    },
    fb2: { 
        category: 'document', 
        label: 'FB2', 
        targets: ['pdf', 'epub', 'txt'],
        description: 'FictionBook - XML-based ebook format'
    },

    // ========================================
    // VIDEO FORMATS (✅ SUPPORTED VIA FFMPEG)
    // ========================================
    mp4: { 
        category: 'video', 
        label: 'MP4', 
        targets: ['mkv', 'avi', 'mov', 'webm', 'gif', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'MPEG-4 Part 14 - most widely supported video format'
    },
    mkv: { 
        category: 'video', 
        label: 'MKV', 
        targets: ['mp4', 'avi', 'mov', 'webm', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Matroska Video - open container format, supports multiple tracks'
    },
    avi: { 
        category: 'video', 
        label: 'AVI', 
        targets: ['mp4', 'mkv', 'mov', 'webm', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Audio Video Interleave - legacy Windows format'
    },
    mov: { 
        category: 'video', 
        label: 'MOV', 
        targets: ['mp4', 'mkv', 'avi', 'webm', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'QuickTime Movie - Apple video format'
    },
    webm: { 
        category: 'video', 
        label: 'WebM', 
        targets: ['mp4', 'mkv', 'avi', 'mov', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Web Media - open format optimized for web streaming'
    },
    '3gp': { 
        category: 'video', 
        label: '3GP', 
        targets: ['mp4', 'mkv', 'avi', 'mp3', 'aac', 'wav'],
        description: '3rd Generation Partnership Project - mobile video format'
    },
    flv: { 
        category: 'video', 
        label: 'FLV', 
        targets: ['mp4', 'mkv', 'avi', 'webm', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Flash Video - legacy web video format'
    },
    wmv: { 
        category: 'video', 
        label: 'WMV', 
        targets: ['mp4', 'mkv', 'avi', 'webm', 'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Windows Media Video - Microsoft streaming format'
    },

    // ========================================
    // AUDIO FORMATS (✅ SUPPORTED VIA FFMPEG)
    // ========================================
    mp3: { 
        category: 'audio', 
        label: 'MP3', 
        targets: ['wav', 'aac', 'ogg', 'flac', 'm4a'],
        description: 'MPEG Audio Layer III - most popular lossy audio format'
    },
    wav: { 
        category: 'audio', 
        label: 'WAV', 
        targets: ['mp3', 'aac', 'ogg', 'flac', 'm4a'],
        description: 'Waveform Audio - uncompressed, high quality'
    },
    aac: { 
        category: 'audio', 
        label: 'AAC', 
        targets: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
        description: 'Advanced Audio Coding - better quality than MP3 at same bitrate'
    },
    ogg: { 
        category: 'audio', 
        label: 'OGG', 
        targets: ['mp3', 'wav', 'aac', 'flac', 'm4a'],
        description: 'Ogg Vorbis - free, open-source audio format'
    },
    flac: { 
        category: 'audio', 
        label: 'FLAC', 
        targets: ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
        description: 'Free Lossless Audio Codec - compressed but lossless'
    },
    wma: { 
        category: 'audio', 
        label: 'WMA', 
        targets: ['mp3', 'wav', 'aac', 'ogg', 'flac'],
        description: 'Windows Media Audio - Microsoft audio format'
    },
    m4a: { 
        category: 'audio', 
        label: 'M4A', 
        targets: ['mp3', 'wav', 'aac', 'ogg', 'flac'],
        description: 'MPEG-4 Audio - typically AAC in MP4 container'
    },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all supported extensions as a flat array
 */
export function getAllSupportedExtensions(): string[] {
    return Object.keys(FORMAT_MAP)
}

/**
 * Get extensions by category
 */
export function getExtensionsByCategory(category: FileCategory): string[] {
    return Object.entries(FORMAT_MAP)
        .filter(([_, info]) => info.category === category)
        .map(([ext, _]) => ext)
}

/**
 * Get the category for a file extension
 */
export function getFileCategory(ext: string): FileCategory | null {
    return FORMAT_MAP[ext.toLowerCase()]?.category ?? null
}

/**
 * Get available conversion targets for a format
 */
export function getTargetFormats(ext: string): string[] {
    return FORMAT_MAP[ext.toLowerCase()]?.targets ?? []
}

/**
 * Get display label for a format
 */
export function getFormatLabel(ext: string): string {
    return FORMAT_MAP[ext.toLowerCase()]?.label ?? ext.toUpperCase()
}

/**
 * Get format description
 */
export function getFormatDescription(ext: string): string | undefined {
    return FORMAT_MAP[ext.toLowerCase()]?.description
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(ext: string): boolean {
    return ext.toLowerCase() in FORMAT_MAP
}

/**
 * Get color class for category (for UI)
 */
export function getCategoryColor(category: FileCategory): string {
    switch (category) {
        case 'image': return 'text-emerald-400'
        case 'document': return 'text-blue-400'
        case 'video': return 'text-amber-400'
        case 'audio': return 'text-pink-400'
    }
}

/**
 * Get background color class for category (for UI)
 */
export function getCategoryBgColor(category: FileCategory): string {
    switch (category) {
        case 'image': return 'bg-emerald-500/10 border-emerald-500/20'
        case 'document': return 'bg-blue-500/10 border-blue-500/20'
        case 'video': return 'bg-amber-500/10 border-amber-500/20'
        case 'audio': return 'bg-pink-500/10 border-pink-500/20'
    }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * File dialog filter structure for Electron
 */
export interface FileDialogFilter {
    name: string
    extensions: string[]
}

/**
 * Generate file dialog filters for Electron
 */
export function getFileDialogFilters(): FileDialogFilter[] {
    return [
        {
            name: 'Supported Files',
            extensions: getAllSupportedExtensions(),
        },
        {
            name: 'Images',
            extensions: getExtensionsByCategory('image'),
        },
        {
            name: 'Documents',
            extensions: getExtensionsByCategory('document'),
        },
        {
            name: 'Video',
            extensions: getExtensionsByCategory('video'),
        },
        {
            name: 'Audio',
            extensions: getExtensionsByCategory('audio'),
        },
        {
            name: 'All Files',
            extensions: ['*'],
        },
    ]
}
