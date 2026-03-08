import path from 'path'
import fs from 'fs/promises'
import { executeFFmpeg, probeMediaFile } from './utils/ffmpeg-wrapper'

export interface AudioConvertOptions {
    sourcePath: string
    outputDir: string
    targetFormat: string
    quality: number          // 1-100
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
    onProgress?: (percent: number) => void
}

export interface ConvertResult {
    success: boolean
    outputPath: string
    error?: string
    durationMs: number
}

// Supported audio formats
const AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'] as const

/**
 * Check if a format is a supported audio format
 */
export function isAudioFormat(ext: string): boolean {
    const lower = ext.toLowerCase()
    return AUDIO_FORMATS.includes(lower as typeof AUDIO_FORMATS[number])
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
    const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`)

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
            newPath = path.join(outputDir, `${baseName} (${counter}).${targetFormat}`)
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
 * Convert an audio file to the target format using FFmpeg.
 */
export async function convertAudio(options: AudioConvertOptions): Promise<ConvertResult> {
    const startTime = Date.now()
    const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior, onProgress } = options

    try {
        // Validate source file exists
        await fs.access(sourcePath)

        // Validate that source is an audio file
        const mediaInfo = await probeMediaFile(sourcePath)
        if (!mediaInfo) {
            return {
                success: false,
                outputPath: '',
                error: 'Failed to probe audio file. The file may be corrupted or in an unsupported format.',
                durationMs: Date.now() - startTime,
            }
        }

        // Check if the file has an audio stream
        if (!mediaInfo.audioCodec) {
            return {
                success: false,
                outputPath: '',
                error: 'Source file does not contain an audio stream.',
                durationMs: Date.now() - startTime,
            }
        }

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

        // Execute FFmpeg conversion
        const result = await executeFFmpeg({
            inputPath: sourcePath,
            outputPath,
            format: targetFormat,
            quality,
            onProgress,
        })

        if (!result.success) {
            return {
                success: false,
                outputPath: '',
                error: result.error || 'FFmpeg conversion failed',
                durationMs: Date.now() - startTime,
            }
        }

        return {
            success: true,
            outputPath,
            durationMs: Date.now() - startTime,
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[audio-converter] Failed to convert ${sourcePath}:`, errorMessage)

        return {
            success: false,
            outputPath: '',
            error: errorMessage,
            durationMs: Date.now() - startTime,
        }
    }
}
