import path from 'path'
import fs from 'fs/promises'
import { executePandoc, canPandocConvert } from './utils/pandoc-wrapper'

export interface DocumentConvertOptions {
    sourcePath: string
    outputDir: string
    targetFormat: string
    quality: number          // 1-100 (not used for documents, but kept for interface consistency)
    overwriteBehavior: 'skip' | 'rename' | 'overwrite'
}

export interface ConvertResult {
    success: boolean
    outputPath: string
    error?: string
    durationMs: number
}

// Supported document formats (note: PDF as input is NOT supported by Pandoc)
const DOCUMENT_FORMATS = ['pdf', 'epub', 'docx', 'txt', 'rtf', 'odt', 'md', 'html'] as const

/**
 * Check if a format is a supported document format
 */
export function isDocumentFormat(ext: string): boolean {
    const lower = ext.toLowerCase()
    return DOCUMENT_FORMATS.includes(lower as typeof DOCUMENT_FORMATS[number])
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
 * Get file extension without the dot
 */
function getExtension(filePath: string): string {
    const ext = path.extname(filePath)
    return ext ? ext.substring(1).toLowerCase() : ''
}

/**
 * Convert a document file to the target format using Pandoc.
 */
export async function convertDocument(options: DocumentConvertOptions): Promise<ConvertResult> {
    const startTime = Date.now()
    const { sourcePath, outputDir, targetFormat, overwriteBehavior } = options

    try {
        // Validate source file exists
        await fs.access(sourcePath)

        // Get source format
        const sourceExt = getExtension(sourcePath)
        if (!sourceExt) {
            return {
                success: false,
                outputPath: '',
                error: 'Could not determine source file format.',
                durationMs: Date.now() - startTime,
            }
        }

        // Check if Pandoc can handle this conversion
        if (!canPandocConvert(sourceExt, targetFormat)) {
            // Special error message for PDF input
            if (sourceExt === 'pdf') {
                return {
                    success: false,
                    outputPath: '',
                    error: 'PDF as input is not supported by Pandoc. To convert from PDF, you would need additional tools like pdftotext.',
                    durationMs: Date.now() - startTime,
                }
            }

            return {
                success: false,
                outputPath: '',
                error: `Pandoc does not support conversion from ${sourceExt} to ${targetFormat}.`,
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

        // Execute Pandoc conversion
        const result = await executePandoc({
            inputPath: sourcePath,
            outputPath,
            targetFormat,
        })

        if (!result.success) {
            return {
                success: false,
                outputPath: '',
                error: result.error || 'Pandoc conversion failed',
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
        console.error(`[document-converter] Failed to convert ${sourcePath}:`, errorMessage)

        return {
            success: false,
            outputPath: '',
            error: errorMessage,
            durationMs: Date.now() - startTime,
        }
    }
}
