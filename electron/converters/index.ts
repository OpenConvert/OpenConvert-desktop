export { convertImage, isImageFormat, generateThumbnail } from './image-converter'
export type { ImageConvertOptions, ConvertResult } from './image-converter'

// Category detection for routing to the right converter
export type ConverterCategory = 'image' | 'document' | 'video' | 'audio'

const IMAGE_FORMATS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'tiff', 'tif', 'svg', 'ico', 'jxl',
])

const DOCUMENT_FORMATS = new Set([
    'pdf', 'epub', 'xps', 'cbz', 'mobi', 'fb2', 'docx', 'txt', 'rtf', 'odt',
])

const VIDEO_FORMATS = new Set([
    'mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv', 'wmv',
])

const AUDIO_FORMATS = new Set([
    'mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a',
])

export function getConverterCategory(ext: string): ConverterCategory | null {
    const lower = ext.toLowerCase()
    if (IMAGE_FORMATS.has(lower)) return 'image'
    if (DOCUMENT_FORMATS.has(lower)) return 'document'
    if (VIDEO_FORMATS.has(lower)) return 'video'
    if (AUDIO_FORMATS.has(lower)) return 'audio'
    return null
}
