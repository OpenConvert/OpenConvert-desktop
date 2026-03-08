/**
 * FFmpeg Wrapper Utility
 * 
 * Provides high-level functions for executing FFmpeg commands:
 * - Probe media files (get duration, codec, resolution, etc.)
 * - Convert media files with progress tracking
 * - Parse FFmpeg output for progress reporting
 */

import { spawn, type ChildProcess } from 'child_process'
import { getFFmpegPath, getFFprobePath } from './binary-checker'

export interface MediaInfo {
    duration: number // in seconds
    width?: number
    height?: number
    videoCodec?: string
    audioCodec?: string
    bitrate?: number
    format?: string
}

export interface FFmpegConvertOptions {
    inputPath: string
    outputPath: string
    format: string
    quality: number // 1-100
    onProgress?: (percent: number) => void
}

export interface FFmpegResult {
    success: boolean
    error?: string
    stderr?: string
}

/**
 * Probe a media file to get its information
 */
export async function probeMediaFile(filePath: string): Promise<MediaInfo | null> {
    const ffprobePath = await getFFprobePath()
    if (!ffprobePath) {
        console.error('[ffmpeg-wrapper] ffprobe not available')
        return null
    }

    return new Promise((resolve) => {
        const args = [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            filePath
        ]

        const child = spawn(ffprobePath, args)
        
        let output = ''
        child.stdout.on('data', (data) => {
            output += data.toString()
        })

        child.on('close', (code) => {
            if (code !== 0) {
                console.error('[ffmpeg-wrapper] ffprobe failed')
                resolve(null)
                return
            }

            try {
                const data = JSON.parse(output)
                const videoStream = data.streams?.find((s: any) => s.codec_type === 'video')
                const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio')

                const info: MediaInfo = {
                    duration: parseFloat(data.format?.duration || '0'),
                    width: videoStream?.width,
                    height: videoStream?.height,
                    videoCodec: videoStream?.codec_name,
                    audioCodec: audioStream?.codec_name,
                    bitrate: parseInt(data.format?.bit_rate || '0'),
                    format: data.format?.format_name,
                }

                resolve(info)
            } catch (err) {
                console.error('[ffmpeg-wrapper] Failed to parse ffprobe output:', err)
                resolve(null)
            }
        })

        child.on('error', (err) => {
            console.error('[ffmpeg-wrapper] ffprobe error:', err)
            resolve(null)
        })
    })
}

/**
 * Parse FFmpeg progress from stderr output
 */
export function parseFFmpegProgress(line: string, totalDuration: number): number | null {
    // FFmpeg outputs progress like: time=00:01:23.45
    const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
    if (!timeMatch) return null

    const [_, hours, minutes, seconds] = timeMatch
    const currentSeconds = 
        parseInt(hours) * 3600 + 
        parseInt(minutes) * 60 + 
        parseFloat(seconds)

    if (totalDuration <= 0) return 0
    
    const percent = Math.min(100, (currentSeconds / totalDuration) * 100)
    return Math.round(percent)
}

/**
 * Build FFmpeg arguments based on quality and format
 */
export function buildFFmpegArgs(options: {
    inputPath: string
    outputPath: string
    format: string
    quality: number
    isVideo: boolean
}): string[] {
    const { inputPath, outputPath, format, quality, isVideo } = options
    const args: string[] = ['-i', inputPath, '-y'] // -y = overwrite without asking

    // Map quality (1-100) to CRF and bitrate
    let crf: number
    let preset: string
    let audioBitrate: string

    if (quality >= 90) {
        // High/Lossless
        crf = quality >= 95 ? 0 : 18
        preset = 'slow'
        audioBitrate = '192k'
    } else if (quality >= 70) {
        // Medium
        crf = 23
        preset = 'medium'
        audioBitrate = '128k'
    } else {
        // Low
        crf = 28
        preset = 'fast'
        audioBitrate = '96k'
    }

    if (isVideo) {
        // Video conversion
        switch (format.toLowerCase()) {
            case 'mp4':
                args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', preset)
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
                break
            case 'mkv':
                args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', preset)
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
                break
            case 'webm':
                args.push('-c:v', 'libvpx-vp9', '-crf', crf.toString(), '-b:v', '0')
                args.push('-c:a', 'libopus', '-b:a', audioBitrate)
                break
            case 'avi':
                args.push('-c:v', 'mpeg4', '-qscale:v', Math.floor((100 - quality) / 10).toString())
                args.push('-c:a', 'libmp3lame', '-b:a', audioBitrate)
                break
            case 'mov':
                args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', preset)
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
                break
            case 'gif':
                // Special case for GIF
                args.push('-vf', 'fps=10,scale=480:-1:flags=lanczos')
                args.push('-c:v', 'gif')
                break
            case '3gp':
                args.push('-c:v', 'h263', '-c:a', 'aac', '-b:a', '64k')
                args.push('-s', '352x288') // Standard 3GP resolution
                break
            case 'flv':
                args.push('-c:v', 'flv', '-c:a', 'libmp3lame', '-b:a', audioBitrate)
                break
            case 'wmv':
                args.push('-c:v', 'wmv2', '-c:a', 'wmav2', '-b:a', audioBitrate)
                break
            default:
                // Generic conversion
                args.push('-c:v', 'libx264', '-crf', crf.toString())
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
        }
    } else {
        // Audio-only conversion
        switch (format.toLowerCase()) {
            case 'mp3':
                args.push('-c:a', 'libmp3lame', '-b:a', audioBitrate)
                break
            case 'aac':
            case 'm4a':
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
                break
            case 'ogg':
                args.push('-c:a', 'libvorbis', '-q:a', Math.floor(quality / 20).toString())
                break
            case 'flac':
                args.push('-c:a', 'flac')
                break
            case 'wav':
                args.push('-c:a', 'pcm_s16le')
                break
            case 'wma':
                args.push('-c:a', 'wmav2', '-b:a', audioBitrate)
                break
            default:
                args.push('-c:a', 'aac', '-b:a', audioBitrate)
        }
    }

    args.push(outputPath)
    return args
}

/**
 * Execute FFmpeg conversion
 */
export async function executeFFmpeg(options: FFmpegConvertOptions): Promise<FFmpegResult> {
    const ffmpegPath = await getFFmpegPath()
    if (!ffmpegPath) {
        return {
            success: false,
            error: 'FFmpeg not available. Please install FFmpeg first.',
        }
    }

    // Probe the input file to get duration for progress calculation
    const mediaInfo = await probeMediaFile(options.inputPath)
    const totalDuration = mediaInfo?.duration || 0

    // Determine if this is a video or audio conversion
    const isVideo = !!(mediaInfo?.videoCodec)

    const args = buildFFmpegArgs({
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        format: options.format,
        quality: options.quality,
        isVideo,
    })

    console.log('[ffmpeg-wrapper] Executing:', ffmpegPath, args.join(' '))

    return new Promise((resolve) => {
        const child: ChildProcess = spawn(ffmpegPath, args)
        
        let stderrOutput = ''
        let lastProgressUpdate = 0

        child.stderr?.on('data', (data) => {
            const line = data.toString()
            stderrOutput += line

            // Parse and emit progress
            if (options.onProgress && totalDuration > 0) {
                const progress = parseFFmpegProgress(line, totalDuration)
                if (progress !== null && Date.now() - lastProgressUpdate > 500) {
                    options.onProgress(progress)
                    lastProgressUpdate = Date.now()
                }
            }
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true })
            } else {
                // Extract error message from stderr
                const errorMatch = stderrOutput.match(/Error.*$/m)
                const error = errorMatch ? errorMatch[0] : 'FFmpeg conversion failed'
                
                resolve({
                    success: false,
                    error,
                    stderr: stderrOutput,
                })
            }
        })

        child.on('error', (err) => {
            resolve({
                success: false,
                error: err.message,
            })
        })

        // Timeout after 30 minutes for very large files
        setTimeout(() => {
            if (!child.killed) {
                child.kill('SIGTERM')
                resolve({
                    success: false,
                    error: 'Conversion timeout (30 minutes maximum)',
                })
            }
        }, 30 * 60 * 1000)
    })
}
