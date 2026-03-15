/**
 * Electron (Node.js) version of the formats configuration
 * This is a direct copy from src/config/formats.ts but adapted for Node.js/CommonJS
 */

import type { FileFilter } from 'electron'

// Re-export the core types and data
export type FileCategory = 'image' | 'document' | 'video' | 'audio'

export interface FormatInfo {
    category: FileCategory
    label: string
    targets: string[]
    description?: string
}

// Import from the shared source
import { FORMAT_MAP as SHARED_FORMAT_MAP } from '../../src/config/formats.js'
export const FORMAT_MAP = SHARED_FORMAT_MAP

/**
 * Get all supported extensions as a flat array
 */
export function getAllSupportedExtensions(): string[] {
    return Object.keys(FORMAT_MAP)
}

/**
 * Get extensions by category
 */
export function getExtensionsByCategory(category: FileCategory): string[] {
    return Object.entries(FORMAT_MAP)
        .filter(([_, info]) => info.category === category)
        .map(([ext, _]) => ext)
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(ext: string): boolean {
    return ext.toLowerCase() in FORMAT_MAP
}

/**
 * Generate file dialog filters for Electron
 */
export function getFileDialogFilters(): FileFilter[] {
    return [
        {
            name: 'Supported Files',
            extensions: getAllSupportedExtensions(),
        },
        {
            name: 'Images',
            extensions: getExtensionsByCategory('image'),
        },
        {
            name: 'Documents',
            extensions: getExtensionsByCategory('document'),
        },
        {
            name: 'Video',
            extensions: getExtensionsByCategory('video'),
        },
        {
            name: 'Audio',
            extensions: getExtensionsByCategory('audio'),
        },
        {
            name: 'All Files',
            extensions: ['*'],
        },
    ]
}
