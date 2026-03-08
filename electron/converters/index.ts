// Image converter
export { convertImage, isImageFormat, generateThumbnail as generateImageThumbnail } from './image-converter'
export type { ImageConvertOptions } from './image-converter'

// Video converter
export { convertVideo, isVideoFormat, generateThumbnail as generateVideoThumbnail } from './video-converter'
export type { VideoConvertOptions } from './video-converter'

// Audio converter
export { convertAudio, isAudioFormat } from './audio-converter'
export type { AudioConvertOptions } from './audio-converter'

// Document converter
export { convertDocument, isDocumentFormat } from './document-converter'
export type { DocumentConvertOptions } from './document-converter'

// Shared types
export type { ConvertResult } from './image-converter'

// Category detection using centralized format configuration
import { FORMAT_MAP, type FileCategory } from '../config/formats'

export type { FileCategory }

export function getConverterCategory(ext: string): FileCategory | null {
    const format = FORMAT_MAP[ext.toLowerCase()]
    return format?.category ?? null
}
