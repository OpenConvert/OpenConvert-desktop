// Format categories and conversion targets
export type FileCategory = 'image' | 'document' | 'video' | 'audio'

export interface FormatInfo {
    category: FileCategory
    label: string
    targets: string[]
}

export const FORMAT_MAP: Record<string, FormatInfo> = {
    // Images
    png: { category: 'image', label: 'PNG', targets: ['jpg', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'] },
    jpg: { category: 'image', label: 'JPEG', targets: ['png', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'] },
    jpeg: { category: 'image', label: 'JPEG', targets: ['png', 'webp', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'] },
    gif: { category: 'image', label: 'GIF', targets: ['png', 'jpg', 'webp', 'bmp', 'avif', 'tiff'] },
    webp: { category: 'image', label: 'WebP', targets: ['png', 'jpg', 'gif', 'bmp', 'avif', 'tiff', 'ico', 'pdf'] },
    bmp: { category: 'image', label: 'BMP', targets: ['png', 'jpg', 'webp', 'gif', 'avif', 'tiff'] },
    avif: { category: 'image', label: 'AVIF', targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'tiff'] },
    tiff: { category: 'image', label: 'TIFF', targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'avif'] },
    tif: { category: 'image', label: 'TIFF', targets: ['png', 'jpg', 'webp', 'gif', 'bmp', 'avif'] },
    svg: { category: 'image', label: 'SVG', targets: ['png', 'jpg', 'webp'] },
    ico: { category: 'image', label: 'ICO', targets: ['png', 'jpg', 'webp'] },
    jxl: { category: 'image', label: 'JXL', targets: ['png', 'jpg', 'webp'] },

    // Documents
    pdf: { category: 'document', label: 'PDF', targets: ['png', 'jpg', 'txt'] },
    epub: { category: 'document', label: 'EPUB', targets: ['pdf', 'txt'] },
    docx: { category: 'document', label: 'DOCX', targets: ['pdf', 'txt'] },
    txt: { category: 'document', label: 'TXT', targets: ['pdf'] },
    rtf: { category: 'document', label: 'RTF', targets: ['pdf', 'txt'] },
    odt: { category: 'document', label: 'ODT', targets: ['pdf', 'txt'] },
    xps: { category: 'document', label: 'XPS', targets: ['pdf', 'png', 'jpg'] },
    cbz: { category: 'document', label: 'CBZ', targets: ['pdf', 'png'] },
    mobi: { category: 'document', label: 'MOBI', targets: ['pdf', 'epub', 'txt'] },
    fb2: { category: 'document', label: 'FB2', targets: ['pdf', 'epub', 'txt'] },

    // Video
    mp4: { category: 'video', label: 'MP4', targets: ['mkv', 'avi', 'mov', 'webm', 'gif'] },
    mkv: { category: 'video', label: 'MKV', targets: ['mp4', 'avi', 'mov', 'webm'] },
    avi: { category: 'video', label: 'AVI', targets: ['mp4', 'mkv', 'mov', 'webm'] },
    mov: { category: 'video', label: 'MOV', targets: ['mp4', 'mkv', 'avi', 'webm'] },
    webm: { category: 'video', label: 'WebM', targets: ['mp4', 'mkv', 'avi', 'mov'] },
    '3gp': { category: 'video', label: '3GP', targets: ['mp4', 'mkv', 'avi'] },
    flv: { category: 'video', label: 'FLV', targets: ['mp4', 'mkv', 'avi', 'webm'] },
    wmv: { category: 'video', label: 'WMV', targets: ['mp4', 'mkv', 'avi', 'webm'] },

    // Audio
    mp3: { category: 'audio', label: 'MP3', targets: ['wav', 'aac', 'ogg', 'flac', 'm4a'] },
    wav: { category: 'audio', label: 'WAV', targets: ['mp3', 'aac', 'ogg', 'flac', 'm4a'] },
    aac: { category: 'audio', label: 'AAC', targets: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] },
    ogg: { category: 'audio', label: 'OGG', targets: ['mp3', 'wav', 'aac', 'flac', 'm4a'] },
    flac: { category: 'audio', label: 'FLAC', targets: ['mp3', 'wav', 'aac', 'ogg', 'm4a'] },
    wma: { category: 'audio', label: 'WMA', targets: ['mp3', 'wav', 'aac', 'ogg', 'flac'] },
    m4a: { category: 'audio', label: 'M4A', targets: ['mp3', 'wav', 'aac', 'ogg', 'flac'] },
}

export function getFileCategory(ext: string): FileCategory | null {
    return FORMAT_MAP[ext]?.category ?? null
}

export function getTargetFormats(ext: string): string[] {
    return FORMAT_MAP[ext]?.targets ?? []
}

export function getCategoryColor(category: FileCategory): string {
    switch (category) {
        case 'image': return 'text-emerald-400'
        case 'document': return 'text-blue-400'
        case 'video': return 'text-amber-400'
        case 'audio': return 'text-pink-400'
    }
}

export function getCategoryBgColor(category: FileCategory): string {
    switch (category) {
        case 'image': return 'bg-emerald-500/10 border-emerald-500/20'
        case 'document': return 'bg-blue-500/10 border-blue-500/20'
        case 'video': return 'bg-amber-500/10 border-amber-500/20'
        case 'audio': return 'bg-pink-500/10 border-pink-500/20'
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
