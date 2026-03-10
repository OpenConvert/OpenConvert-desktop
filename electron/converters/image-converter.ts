import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

export interface ImageOptimizationOptions {
    resize?: {
        width?: number
        height?: number
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    }
    rotate?: number // Degrees: 0, 90, 180, 270
    stripMetadata?: boolean
}

export interface ImageConvertOptions {
    sourcePath: string
    outputDir: string
    targetFormat: string
    quality: number          // 1-100
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
    optimizations?: ImageOptimizationOptions
}

export interface ConvertResult {
    success: boolean
    outputPath: string
    error?: string
    durationMs: number
}

// Formats natively supported by Sharp
const SHARP_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'tiff', 'tif', 'jxl'] as const

// Formats we can read but need special handling
const SPECIAL_INPUT_FORMATS = ['svg', 'ico', 'bmp'] as const

/**
 * Check if a format is supported by our image converter
 */
export function isImageFormat(ext: string): boolean {
    const lower = ext.toLowerCase()
    return [...SHARP_FORMATS, ...SPECIAL_INPUT_FORMATS].includes(lower as typeof SHARP_FORMATS[number] | typeof SPECIAL_INPUT_FORMATS[number])
}

/**
 * Generate a unique output file path, handling conflicts based on overwrite behavior.
 */
async function resolveOutputPath(
    outputDir: string,
    baseName: string,
    targetFormat: string,
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
): Promise<{ path: string; skip: boolean }> {
    const ext = targetFormat === 'jpg' ? 'jpg' : targetFormat
    const outputPath = path.join(outputDir, `${baseName}.${ext}`)

    try {
        await fs.access(outputPath)
        // File exists
        if (overwriteBehavior === 'overwrite') {
            return { path: outputPath, skip: false }
        }
        if (overwriteBehavior === 'skip') {
            return { path: outputPath, skip: true }
        }
        // rename: find next available name
        let counter = 1
        let newPath: string
        do {
            newPath = path.join(outputDir, `${baseName} (${counter}).${ext}`)
            counter++
            try {
                await fs.access(newPath)
            } catch {
                // File doesn't exist, use this path
                return { path: newPath, skip: false }
            }
        } while (counter < 10000)

        return { path: newPath, skip: false }
    } catch {
        // File doesn't exist, use original path
        return { path: outputPath, skip: false }
    }
}

/**
 * Get the base name of a file without its extension
 */
function getBaseName(filePath: string): string {
    const name = path.basename(filePath)
    const lastDot = name.lastIndexOf('.')
    if (lastDot === -1) return name
    return name.substring(0, lastDot)
}

/**
 * Convert an image file to the target format using Sharp.
 */
export async function convertImage(options: ImageConvertOptions): Promise<ConvertResult> {
    const startTime = Date.now()
    const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior } = options

    try {
        // Validate source file exists
        await fs.access(sourcePath)

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true })

        // Resolve output path
        const baseName = getBaseName(sourcePath)
        const { path: outputPath, skip } = await resolveOutputPath(
            outputDir,
            baseName,
            targetFormat,
            overwriteBehavior
        )

        if (skip) {
            return {
                success: true,
                outputPath,
                durationMs: Date.now() - startTime,
            }
        }

        // Create Sharp pipeline
        let pipeline = sharp(sourcePath, {
            animated: false, // Don't process animated frames for conversion
            failOn: 'none',  // Don't fail on minor image issues
        })

        // Apply optimization options if provided
        const opts = options.optimizations
        
        // Apply rotation
        if (opts?.rotate && opts.rotate !== 0) {
            pipeline = pipeline.rotate(opts.rotate)
        }

        // Apply resize
        if (opts?.resize) {
            const { width, height, fit = 'inside' } = opts.resize
            if (width || height) {
                pipeline = pipeline.resize(width, height, {
                    fit,
                    withoutEnlargement: true,
                })
            }
        }

        // Strip metadata if requested
        if (opts?.stripMetadata) {
            pipeline = pipeline.withMetadata({
                // Keep orientation but remove other EXIF data
                orientation: undefined,
            })
        }

        // Apply format-specific conversion
        const format = targetFormat.toLowerCase()
        switch (format) {
            case 'png':
                pipeline = pipeline.png({
                    quality,
                    compressionLevel: quality >= 90 ? 6 : quality >= 60 ? 7 : 9,
                })
                break

            case 'jpg':
            case 'jpeg':
                pipeline = pipeline.jpeg({
                    quality,
                    mozjpeg: true, // Better compression
                })
                break

            case 'webp':
                pipeline = pipeline.webp({
                    quality,
                    lossless: quality >= 100,
                })
                break

            case 'avif':
                pipeline = pipeline.avif({
                    quality,
                    lossless: quality >= 100,
                })
                break

            case 'gif':
                pipeline = pipeline.gif()
                break

            case 'tiff':
            case 'tif':
                pipeline = pipeline.tiff({
                    quality,
                    compression: 'lzw',
                })
                break

            case 'jxl':
                pipeline = pipeline.jxl({
                    quality,
                    lossless: quality >= 100,
                })
                break

            case 'bmp':
                // Sharp doesn't support BMP output natively;
                // convert to PNG as a raw bitmap alternative
                pipeline = pipeline.png({ compressionLevel: 0 })
                break

            case 'ico':
                // ICO: resize to 256x256 max, output as PNG (common ICO approach)
                pipeline = pipeline
                    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
                    .png()
                break

            case 'pdf':
                // For image-to-PDF: not supported by Sharp alone
                // We would need a separate PDF library
                return {
                    success: false,
                    outputPath: '',
                    error: 'Image to PDF conversion is not yet supported. A document converter is required.',
                    durationMs: Date.now() - startTime,
                }

            default:
                return {
                    success: false,
                    outputPath: '',
                    error: `Unsupported target format: ${format}`,
                    durationMs: Date.now() - startTime,
                }
        }

        // Execute conversion
        await pipeline.toFile(outputPath)

        return {
            success: true,
            outputPath,
            durationMs: Date.now() - startTime,
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[image-converter] Failed to convert ${sourcePath}:`, errorMessage)

        return {
            success: false,
            outputPath: '',
            error: errorMessage,
            durationMs: Date.now() - startTime,
        }
    }
}

/**
 * Generate a thumbnail for an image file.
 * Returns a base64 data URL.
 */
export async function generateThumbnail(
    filePath: string,
    size: number = 128
): Promise<string | null> {
    try {
        const buffer = await sharp(filePath, {
            failOn: 'none',
        })
            .resize(size, size, {
                fit: 'cover',
                position: 'centre',
            })
            .png({ quality: 70, compressionLevel: 9 })
            .toBuffer()

        return `data:image/png;base64,${buffer.toString('base64')}`
    } catch (err) {
        console.error(`[image-converter] Failed to generate thumbnail for ${filePath}:`, err)
        return null
    }
}
