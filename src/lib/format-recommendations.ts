/**
 * ============================================================================
 * FORMAT RECOMMENDATIONS AND SMART SUGGESTIONS
 * ============================================================================
 * Provides intelligent format suggestions based on use cases and file characteristics
 */

import { getFileCategory, type FileCategory } from '@/config/formats'

export interface FormatRecommendation {
    format: string
    reason: string
    estimatedSizeMultiplier: number // Multiplier for estimated output size (1.0 = same size)
    quality: 'best' | 'good' | 'balanced' | 'compressed'
    useCase: string[]
}

export interface UseCaseProfile {
    name: string
    description: string
    icon: string
    recommendations: Map<FileCategory, string[]> // category -> recommended formats
}

/**
 * Predefined use case profiles
 */
export const USE_CASE_PROFILES: UseCaseProfile[] = [
    {
        name: 'Web Optimized',
        description: 'Best formats for web use - fast loading, good compression',
        icon: '🌐',
        recommendations: new Map([
            ['image', ['webp', 'avif', 'jpg']],
            ['video', ['webm', 'mp4']],
            ['audio', ['aac', 'mp3']],
            ['document', ['pdf']],
        ]),
    },
    {
        name: 'Maximum Quality',
        description: 'Preserve quality - for archival or professional use',
        icon: '💎',
        recommendations: new Map([
            ['image', ['png', 'tiff']],
            ['video', ['mkv', 'mov']],
            ['audio', ['flac', 'wav']],
            ['document', ['pdf']],
        ]),
    },
    {
        name: 'Smallest File Size',
        description: 'Maximum compression - for storage or sharing',
        icon: '📦',
        recommendations: new Map([
            ['image', ['avif', 'webp', 'jpg']],
            ['video', ['webm', 'mp4']],
            ['audio', ['aac', 'ogg']],
            ['document', ['pdf']],
        ]),
    },
    {
        name: 'Universal Compatibility',
        description: 'Works everywhere - maximum device support',
        icon: '🔌',
        recommendations: new Map([
            ['image', ['jpg', 'png']],
            ['video', ['mp4']],
            ['audio', ['mp3']],
            ['document', ['pdf']],
        ]),
    },
]

/**
 * Format-specific metadata for recommendations
 */
const FORMAT_METADATA: Record<string, FormatRecommendation> = {
    // Images
    webp: {
        format: 'webp',
        reason: 'Superior compression with transparency support',
        estimatedSizeMultiplier: 0.25,
        quality: 'balanced',
        useCase: ['web', 'sharing', 'compression'],
    },
    avif: {
        format: 'avif',
        reason: 'Best compression ratio available',
        estimatedSizeMultiplier: 0.15,
        quality: 'best',
        useCase: ['web', 'modern', 'compression'],
    },
    png: {
        format: 'png',
        reason: 'Lossless quality with transparency',
        estimatedSizeMultiplier: 1.2,
        quality: 'best',
        useCase: ['quality', 'transparency', 'archival'],
    },
    jpg: {
        format: 'jpg',
        reason: 'Universal compatibility and good compression',
        estimatedSizeMultiplier: 0.3,
        quality: 'good',
        useCase: ['compatibility', 'web', 'photos'],
    },
    tiff: {
        format: 'tiff',
        reason: 'Professional-grade quality',
        estimatedSizeMultiplier: 2.0,
        quality: 'best',
        useCase: ['professional', 'printing', 'archival'],
    },
    gif: {
        format: 'gif',
        reason: 'Animation support',
        estimatedSizeMultiplier: 0.4,
        quality: 'compressed',
        useCase: ['animation', 'legacy'],
    },

    // Video
    mp4: {
        format: 'mp4',
        reason: 'Universal compatibility and good compression',
        estimatedSizeMultiplier: 0.7,
        quality: 'balanced',
        useCase: ['compatibility', 'web', 'mobile'],
    },
    webm: {
        format: 'webm',
        reason: 'Best for web streaming',
        estimatedSizeMultiplier: 0.6,
        quality: 'good',
        useCase: ['web', 'streaming', 'compression'],
    },
    mkv: {
        format: 'mkv',
        reason: 'Preserves quality and metadata',
        estimatedSizeMultiplier: 1.0,
        quality: 'best',
        useCase: ['quality', 'archival', 'features'],
    },
    mov: {
        format: 'mov',
        reason: 'High quality for editing',
        estimatedSizeMultiplier: 1.1,
        quality: 'best',
        useCase: ['editing', 'quality', 'apple'],
    },

    // Audio
    mp3: {
        format: 'mp3',
        reason: 'Universal compatibility',
        estimatedSizeMultiplier: 0.1,
        quality: 'good',
        useCase: ['compatibility', 'portable', 'music'],
    },
    flac: {
        format: 'flac',
        reason: 'Lossless compression',
        estimatedSizeMultiplier: 0.5,
        quality: 'best',
        useCase: ['quality', 'archival', 'audiophile'],
    },
    aac: {
        format: 'aac',
        reason: 'Better quality than MP3 at same size',
        estimatedSizeMultiplier: 0.12,
        quality: 'balanced',
        useCase: ['quality', 'modern', 'streaming'],
    },
    wav: {
        format: 'wav',
        reason: 'Uncompressed original quality',
        estimatedSizeMultiplier: 1.0,
        quality: 'best',
        useCase: ['professional', 'editing', 'uncompressed'],
    },

    // Documents
    pdf: {
        format: 'pdf',
        reason: 'Universal document standard',
        estimatedSizeMultiplier: 0.8,
        quality: 'balanced',
        useCase: ['compatibility', 'sharing', 'printing'],
    },
    txt: {
        format: 'txt',
        reason: 'Plain text extraction',
        estimatedSizeMultiplier: 0.01,
        quality: 'compressed',
        useCase: ['text-only', 'minimal'],
    },
}

/**
 * Get smart recommendations for a given file extension
 */
export function getFormatRecommendations(ext: string): FormatRecommendation[] {
    const category = getFileCategory(ext)
    if (!category) return []

    // Get recommendations for each use case
    const recommendations: FormatRecommendation[] = []
    
    USE_CASE_PROFILES.forEach((profile) => {
        const formats = profile.recommendations.get(category) || []
        formats.forEach((format) => {
            if (FORMAT_METADATA[format]) {
                recommendations.push(FORMAT_METADATA[format])
            }
        })
    })

    // Remove duplicates and return top 3
    const unique = Array.from(
        new Map(recommendations.map((r) => [r.format, r])).values()
    )

    return unique.slice(0, 3)
}

/**
 * Get the best format recommendation for a specific use case
 */
export function getBestFormatForUseCase(
    ext: string,
    useCaseName: string
): string | null {
    const category = getFileCategory(ext)
    if (!category) return null

    const profile = USE_CASE_PROFILES.find((p) => p.name === useCaseName)
    if (!profile) return null

    const formats = profile.recommendations.get(category)
    return formats?.[0] || null
}

/**
 * Estimate output file size based on format and quality
 */
export function estimateOutputSize(
    sourceSize: number,
    _sourceExt: string,
    targetFormat: string,
    quality: number // 0-100
): number {
    const metadata = FORMAT_METADATA[targetFormat]
    if (!metadata) return sourceSize

    let multiplier = metadata.estimatedSizeMultiplier

    // Adjust based on quality setting
    const qualityFactor = quality / 100
    
    // Higher quality = less compression = larger size
    if (metadata.quality === 'compressed') {
        multiplier *= 0.8 + (qualityFactor * 0.4) // Range: 0.8x - 1.2x
    } else if (metadata.quality === 'balanced') {
        multiplier *= 0.6 + (qualityFactor * 0.8) // Range: 0.6x - 1.4x
    } else if (metadata.quality === 'good') {
        multiplier *= 0.7 + (qualityFactor * 0.6) // Range: 0.7x - 1.3x
    } else {
        // 'best' quality doesn't compress much
        multiplier *= 0.9 + (qualityFactor * 0.2) // Range: 0.9x - 1.1x
    }

    return Math.round(sourceSize * multiplier)
}

/**
 * Get a human-readable recommendation reason
 */
export function getRecommendationReason(targetFormat: string): string {
    return FORMAT_METADATA[targetFormat]?.reason || 'Good choice'
}

/**
 * Suggest best format based on file characteristics
 */
export function suggestBestFormat(
    ext: string,
    size: number,
    preferQuality: boolean = false
): string | null {
    const category = getFileCategory(ext)
    if (!category) return null

    // If file is large, suggest compression
    const isLargeFile = size > 50 * 1024 * 1024 // > 50MB

    if (isLargeFile && !preferQuality) {
        // Suggest compression-focused format
        const profile = USE_CASE_PROFILES.find((p) => p.name === 'Smallest File Size')
        const formats = profile?.recommendations.get(category)
        return formats?.[0] || null
    }

    if (preferQuality) {
        // Suggest quality-focused format
        const profile = USE_CASE_PROFILES.find((p) => p.name === 'Maximum Quality')
        const formats = profile?.recommendations.get(category)
        return formats?.[0] || null
    }

    // Default: balanced web-optimized format
    const profile = USE_CASE_PROFILES.find((p) => p.name === 'Web Optimized')
    const formats = profile?.recommendations.get(category)
    return formats?.[0] || null
}
