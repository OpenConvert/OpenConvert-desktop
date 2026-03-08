export { convertImage, isImageFormat, generateThumbnail } from './image-converter'
export type { ImageConvertOptions, ConvertResult } from './image-converter'

// Category detection using centralized format configuration
import { FORMAT_MAP, type FileCategory } from '../config/formats'

export type { FileCategory }

export function getConverterCategory(ext: string): FileCategory | null {
    const format = FORMAT_MAP[ext.toLowerCase()]
    return format?.category ?? null
}
