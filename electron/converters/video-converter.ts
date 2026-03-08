import path from 'path'
import fs from 'fs/promises'
import { executeFFmpeg, probeMediaFile } from './utils/ffmpeg-wrapper'

export interface VideoConvertOptions {
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

// Supported video formats
const VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv', 'wmv', 'gif'] as const

/**
 * Check if a format is a supported video format
 */
export function isVideoFormat(ext: string): boolean {
    const lower = ext.toLowerCase()
    return VIDEO_FORMATS.includes(lower as typeof VIDEO_FORMATS[number])
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
 * Convert a video file to the target format using FFmpeg.
 */
export async function convertVideo(options: VideoConvertOptions): Promise<ConvertResult> {
    const startTime = Date.now()
    const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior, onProgress } = options

    try {
        // Validate source file exists
        await fs.access(sourcePath)

        // Validate that source is a video file
        const mediaInfo = await probeMediaFile(sourcePath)
        if (!mediaInfo) {
            return {
                success: false,
                outputPath: '',
                error: 'Failed to probe video file. The file may be corrupted or in an unsupported format.',
                durationMs: Date.now() - startTime,
            }
        }

        // Check if the file has a video stream (unless converting to GIF, which can be from images)
        if (!mediaInfo.videoCodec && targetFormat !== 'gif') {
            return {
                success: false,
                outputPath: '',
                error: 'Source file does not contain a video stream.',
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
        console.error(`[video-converter] Failed to convert ${sourcePath}:`, errorMessage)

        return {
            success: false,
            outputPath: '',
            error: errorMessage,
            durationMs: Date.now() - startTime,
        }
    }
}

/**
 * Generate a thumbnail for a video file.
 * Returns a base64 data URL.
 */
export async function generateThumbnail(
    filePath: string,
    size: number = 128
): Promise<string | null> {
    try {
        const { getFFmpegPath } = await import('./utils/binary-checker')
        const { spawn } = await import('child_process')
        const os = await import('os')
        const tmpPath = path.join(os.tmpdir(), `thumb-${Date.now()}.png`)

        const ffmpegPath = await getFFmpegPath()
        if (!ffmpegPath) {
            console.error('[video-converter] FFmpeg not available for thumbnail generation')
            return null
        }

        // Extract frame at 1 second (or 10% of duration, whichever is smaller)
        const mediaInfo = await probeMediaFile(filePath)
        const seekTime = mediaInfo ? Math.min(1, mediaInfo.duration * 0.1) : 1

        // Use FFmpeg to extract a single frame
        const args = [
            '-ss', seekTime.toString(),
            '-i', filePath,
            '-vframes', '1',
            '-vf', `scale=${size}:${size}:force_original_aspect_ratio=decrease`,
            '-y',
            tmpPath
        ]

        await new Promise<void>((resolve, reject) => {
            const child = spawn(ffmpegPath, args)
            child.on('close', (code) => {
                if (code === 0) resolve()
                else reject(new Error(`FFmpeg exited with code ${code}`))
            })
            child.on('error', reject)
        })

        // Read the thumbnail and convert to base64
        const buffer = await fs.readFile(tmpPath)
        await fs.unlink(tmpPath).catch(() => {}) // Clean up temp file

        return `data:image/png;base64,${buffer.toString('base64')}`
    } catch (err) {
        console.error(`[video-converter] Failed to generate thumbnail for ${filePath}:`, err)
        return null
    }
}
