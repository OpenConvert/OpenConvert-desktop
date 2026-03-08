/**
 * Pandoc Wrapper Utility
 * 
 * Provides high-level functions for executing Pandoc commands:
 * - Convert document formats
 * - Handle PDF special cases
 */

import { spawn } from 'child_process'
import { getPandocPath } from './binary-checker'

export interface PandocConvertOptions {
    inputPath: string
    outputPath: string
    targetFormat: string
}

export interface PandocResult {
    success: boolean
    error?: string
    stderr?: string
}

/**
 * Get Pandoc format name from file extension
 */
function getPandocFormat(ext: string): string {
    const formatMap: Record<string, string> = {
        'md': 'markdown',
        'markdown': 'markdown',
        'rst': 'rst',
        'txt': 'plain',
        'html': 'html',
        'htm': 'html',
        'pdf': 'pdf',
        'docx': 'docx',
        'odt': 'odt',
        'epub': 'epub',
        'rtf': 'rtf',
        'tex': 'latex',
        'latex': 'latex',
    }
    return formatMap[ext.toLowerCase()] || ext.toLowerCase()
}

/**
 * Build Pandoc arguments
 */
function buildPandocArgs(options: PandocConvertOptions): string[] {
    const { inputPath, outputPath, targetFormat } = options
    const args: string[] = [inputPath, '-o', outputPath]

    // Add format-specific options
    const format = targetFormat.toLowerCase()
    
    if (format === 'pdf') {
        // For PDF output, try to use pdflatex or xelatex
        args.push('--pdf-engine=xelatex')
        // Add some sensible defaults for PDF
        args.push('-V', 'geometry:margin=1in')
    } else if (format === 'txt' || format === 'plain') {
        // Plain text output
        args.push('-t', 'plain')
        args.push('--wrap=auto')
    } else if (format === 'docx') {
        // DOCX output - standalone document
        args.push('--standalone')
    } else if (format === 'epub') {
        // EPUB output
        args.push('--epub-cover-image=/dev/null') // Prevent cover image errors
        args.push('--standalone')
    }

    return args
}

/**
 * Execute Pandoc conversion
 */
export async function executePandoc(options: PandocConvertOptions): Promise<PandocResult> {
    const pandocPath = await getPandocPath()
    if (!pandocPath) {
        return {
            success: false,
            error: 'Pandoc not available. Please install Pandoc first.',
        }
    }

    const args = buildPandocArgs(options)
    
    console.log('[pandoc-wrapper] Executing:', pandocPath, args.join(' '))

    return new Promise((resolve) => {
        const child = spawn(pandocPath, args)
        
        let stdoutOutput = ''
        let stderrOutput = ''

        child.stdout.on('data', (data) => {
            stdoutOutput += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderrOutput += data.toString()
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true })
            } else {
                // Extract error from stderr
                const error = stderrOutput.trim() || 'Pandoc conversion failed'
                
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

        // Timeout after 5 minutes
        setTimeout(() => {
            if (!child.killed) {
                child.kill('SIGTERM')
                resolve({
                    success: false,
                    error: 'Conversion timeout (5 minutes maximum)',
                })
            }
        }, 5 * 60 * 1000)
    })
}

/**
 * Check if Pandoc can handle a specific conversion
 */
export function canPandocConvert(sourceExt: string, targetExt: string): boolean {
    const pandocFormats = new Set([
        'md', 'markdown', 'rst', 'txt', 'html', 'htm', 'pdf', 
        'docx', 'odt', 'epub', 'rtf', 'tex', 'latex', 'plain'
    ])

    // PDF as input is NOT supported by Pandoc directly
    if (sourceExt.toLowerCase() === 'pdf') {
        return false
    }

    // Check if both formats are supported
    return pandocFormats.has(sourceExt.toLowerCase()) && 
           pandocFormats.has(targetExt.toLowerCase())
}
