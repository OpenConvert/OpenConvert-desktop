/**
 * ============================================================================
 * OPENCONVERT PRESET SYSTEM
 * ============================================================================
 * 
 * This file defines the preset system for quick conversion templates.
 * Presets store pre-configured conversion settings for common use cases.
 * ============================================================================
 */

export type PresetCategory = 'video' | 'audio' | 'image' | 'document'
export type PresetTab = 'recently' | 'video' | 'audio' | 'device' | 'social'

// Preset-specific sub-categories
export type DeviceBrand = 'apple' | 'samsung' | 'google' | 'sony' | 'microsoft'
export type SocialPlatform = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'twitch' | 'twitter'
export type VideoCategory = 'general' | 'hd' | '4k' | 'web' | 'streaming'
export type AudioCategory = 'general' | 'music' | 'podcast' | 'audiobook'

export interface VideoPresetSettings {
    targetFormat: string
    resolution?: string // e.g., '1920x1080', '1280x720'
    videoBitrate?: string // e.g., '1M', '2M', '5M'
    audioBitrate?: string // e.g., '128k', '192k', '320k'
    fps?: number // Frames per second
    videoCodec?: string // e.g., 'libx264', 'libx265', 'vp9'
    audioCodec?: string // e.g., 'aac', 'mp3', 'opus'
}

export interface AudioPresetSettings {
    targetFormat: string
    audioBitrate?: string // e.g., '128k', '192k', '320k'
    sampleRate?: number // e.g., 44100, 48000
    channels?: number // 1 = mono, 2 = stereo
    audioCodec?: string // e.g., 'aac', 'mp3', 'flac'
}

export interface ImagePresetSettings {
    targetFormat: string
    width?: number
    height?: number
    quality?: number // 1-100
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface DocumentPresetSettings {
    targetFormat: string
    pageSize?: string // e.g., 'A4', 'Letter'
}

export type PresetSettings = VideoPresetSettings | AudioPresetSettings | ImagePresetSettings | DocumentPresetSettings

export interface Preset {
    id: string // Unique identifier
    name: string // Display name
    description?: string // Optional description
    category: PresetCategory // video, audio, image, document
    icon?: string // Optional icon name (from lucide-react)
    
    // Tab classification
    tab: PresetTab // Which tab it appears under
    
    // Sub-category (for filtering in sidebar)
    subcategory?: DeviceBrand | SocialPlatform | VideoCategory | AudioCategory
    
    // Conversion settings
    settings: PresetSettings
    
    // Metadata
    isBuiltIn: boolean // Built-in presets cannot be deleted
    isRecent?: boolean // Recently used preset
    lastUsed?: number // Timestamp of last use
    useCount?: number // Number of times used
}

// ============================================================================
// BUILT-IN PRESETS
// ============================================================================

export const BUILTIN_PRESETS: Preset[] = [
    // ========================================
    // VIDEO PRESETS - GENERAL
    // ========================================
    {
        id: 'video-hd-1080p',
        name: 'Full HD (1080p)',
        description: 'High quality 1080p video',
        category: 'video',
        tab: 'video',
        subcategory: 'hd',
        icon: 'Video',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1920x1080',
            videoBitrate: '5M',
            audioBitrate: '192k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'video-hd-720p',
        name: 'HD (720p)',
        description: 'Standard HD quality',
        category: 'video',
        tab: 'video',
        subcategory: 'hd',
        icon: 'Video',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1280x720',
            videoBitrate: '2.5M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'video-4k',
        name: '4K Ultra HD',
        description: 'Ultra high quality 4K video',
        category: 'video',
        tab: 'video',
        subcategory: '4k',
        icon: 'Monitor',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '3840x2160',
            videoBitrate: '20M',
            audioBitrate: '320k',
            fps: 60,
            videoCodec: 'libx265',
            audioCodec: 'aac',
        }
    },
    {
        id: 'video-web-optimized',
        name: 'Web Optimized',
        description: 'Compressed for web streaming',
        category: 'video',
        tab: 'video',
        subcategory: 'web',
        icon: 'Globe',
        isBuiltIn: true,
        settings: {
            targetFormat: 'webm',
            resolution: '1280x720',
            videoBitrate: '1M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'vp9',
            audioCodec: 'opus',
        }
    },

    // ========================================
    // DEVICE PRESETS - APPLE
    // ========================================
    {
        id: 'device-iphone-15',
        name: 'iPhone 15 / 15 Pro',
        description: 'Optimized for iPhone 15 series',
        category: 'video',
        tab: 'device',
        subcategory: 'apple',
        icon: 'Smartphone',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1170x2532',
            videoBitrate: '8M',
            audioBitrate: '192k',
            fps: 60,
            videoCodec: 'libx265',
            audioCodec: 'aac',
        }
    },
    {
        id: 'device-ipad-pro',
        name: 'iPad Pro',
        description: 'Optimized for iPad Pro',
        category: 'video',
        tab: 'device',
        subcategory: 'apple',
        icon: 'Tablet',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '2048x2732',
            videoBitrate: '10M',
            audioBitrate: '256k',
            fps: 60,
            videoCodec: 'libx265',
            audioCodec: 'aac',
        }
    },
    {
        id: 'device-macbook',
        name: 'MacBook',
        description: 'Optimized for MacBook displays',
        category: 'video',
        tab: 'device',
        subcategory: 'apple',
        icon: 'Laptop',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1920x1080',
            videoBitrate: '6M',
            audioBitrate: '192k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // DEVICE PRESETS - SAMSUNG
    // ========================================
    {
        id: 'device-samsung-s24',
        name: 'Samsung Galaxy S24',
        description: 'Optimized for Galaxy S24',
        category: 'video',
        tab: 'device',
        subcategory: 'samsung',
        icon: 'Smartphone',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x2340',
            videoBitrate: '8M',
            audioBitrate: '192k',
            fps: 60,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // SOCIAL VIDEO PRESETS - YOUTUBE
    // ========================================
    {
        id: 'social-youtube-4k',
        name: 'YouTube 4K',
        description: 'YouTube recommended 4K settings',
        category: 'video',
        tab: 'social',
        subcategory: 'youtube',
        icon: 'Youtube',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '3840x2160',
            videoBitrate: '40M',
            audioBitrate: '192k',
            fps: 60,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'social-youtube-1080p',
        name: 'YouTube 1080p',
        description: 'YouTube recommended 1080p settings',
        category: 'video',
        tab: 'social',
        subcategory: 'youtube',
        icon: 'Youtube',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1920x1080',
            videoBitrate: '8M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'social-youtube-shorts',
        name: 'YouTube Shorts',
        description: 'Vertical video for YouTube Shorts',
        category: 'video',
        tab: 'social',
        subcategory: 'youtube',
        icon: 'Youtube',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x1920',
            videoBitrate: '5M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // SOCIAL VIDEO PRESETS - TIKTOK
    // ========================================
    {
        id: 'social-tiktok',
        name: 'TikTok',
        description: 'Optimized for TikTok uploads',
        category: 'video',
        tab: 'social',
        subcategory: 'tiktok',
        icon: 'Film',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x1920',
            videoBitrate: '5M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // SOCIAL VIDEO PRESETS - INSTAGRAM
    // ========================================
    {
        id: 'social-instagram-feed',
        name: 'Instagram Feed',
        description: 'Square or portrait for Instagram feed',
        category: 'video',
        tab: 'social',
        subcategory: 'instagram',
        icon: 'Instagram',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x1080',
            videoBitrate: '5M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'social-instagram-reels',
        name: 'Instagram Reels',
        description: 'Vertical video for Instagram Reels',
        category: 'video',
        tab: 'social',
        subcategory: 'instagram',
        icon: 'Instagram',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x1920',
            videoBitrate: '5M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },
    {
        id: 'social-instagram-story',
        name: 'Instagram Story',
        description: 'Vertical video for Instagram Stories',
        category: 'video',
        tab: 'social',
        subcategory: 'instagram',
        icon: 'Instagram',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1080x1920',
            videoBitrate: '3M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // SOCIAL VIDEO PRESETS - FACEBOOK
    // ========================================
    {
        id: 'social-facebook',
        name: 'Facebook',
        description: 'Optimized for Facebook video',
        category: 'video',
        tab: 'social',
        subcategory: 'facebook',
        icon: 'Facebook',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1280x720',
            videoBitrate: '4M',
            audioBitrate: '128k',
            fps: 30,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // SOCIAL VIDEO PRESETS - TWITCH
    // ========================================
    {
        id: 'social-twitch-1080p',
        name: 'Twitch 1080p',
        description: 'Twitch streaming at 1080p',
        category: 'video',
        tab: 'social',
        subcategory: 'twitch',
        icon: 'Tv',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp4',
            resolution: '1920x1080',
            videoBitrate: '6M',
            audioBitrate: '160k',
            fps: 60,
            videoCodec: 'libx264',
            audioCodec: 'aac',
        }
    },

    // ========================================
    // AUDIO PRESETS
    // ========================================
    {
        id: 'audio-high-quality',
        name: 'High Quality MP3',
        description: '320kbps MP3',
        category: 'audio',
        tab: 'audio',
        subcategory: 'music',
        icon: 'Music',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp3',
            audioBitrate: '320k',
            sampleRate: 48000,
            channels: 2,
            audioCodec: 'mp3',
        }
    },
    {
        id: 'audio-standard-quality',
        name: 'Standard Quality MP3',
        description: '192kbps MP3',
        category: 'audio',
        tab: 'audio',
        subcategory: 'music',
        icon: 'Music',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp3',
            audioBitrate: '192k',
            sampleRate: 44100,
            channels: 2,
            audioCodec: 'mp3',
        }
    },
    {
        id: 'audio-podcast',
        name: 'Podcast',
        description: 'Optimized for voice (mono)',
        category: 'audio',
        tab: 'audio',
        subcategory: 'podcast',
        icon: 'Mic',
        isBuiltIn: true,
        settings: {
            targetFormat: 'mp3',
            audioBitrate: '128k',
            sampleRate: 44100,
            channels: 1,
            audioCodec: 'mp3',
        }
    },
    {
        id: 'audio-lossless',
        name: 'Lossless FLAC',
        description: 'Lossless audio quality',
        category: 'audio',
        tab: 'audio',
        subcategory: 'music',
        icon: 'Music',
        isBuiltIn: true,
        settings: {
            targetFormat: 'flac',
            sampleRate: 48000,
            channels: 2,
            audioCodec: 'flac',
        }
    },

    // ========================================
    // IMAGE PRESETS
    // ========================================
    {
        id: 'image-web-optimized',
        name: 'Web Optimized',
        description: 'Compressed for web (WebP)',
        category: 'image',
        tab: 'video',
        icon: 'Image',
        isBuiltIn: true,
        settings: {
            targetFormat: 'webp',
            quality: 85,
        }
    },
    {
        id: 'image-thumbnail',
        name: 'Thumbnail',
        description: 'Small preview image',
        category: 'image',
        tab: 'video',
        icon: 'Image',
        isBuiltIn: true,
        settings: {
            targetFormat: 'jpg',
            width: 320,
            height: 180,
            quality: 80,
            fit: 'cover',
        }
    },
    {
        id: 'image-social-post',
        name: 'Social Media Post',
        description: 'Square 1080x1080 for Instagram/Facebook',
        category: 'image',
        tab: 'video',
        icon: 'Image',
        isBuiltIn: true,
        settings: {
            targetFormat: 'jpg',
            width: 1080,
            height: 1080,
            quality: 90,
            fit: 'cover',
        }
    },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get presets by tab
 */
export function getPresetsByTab(tab: PresetTab, presets: Preset[] = BUILTIN_PRESETS): Preset[] {
    if (tab === 'recently') {
        return presets
            .filter(p => p.isRecent)
            .sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0))
    }
    return presets.filter(p => p.tab === tab)
}

/**
 * Get presets by subcategory
 */
export function getPresetsBySubcategory(
    subcategory: string,
    presets: Preset[] = BUILTIN_PRESETS
): Preset[] {
    return presets.filter(p => p.subcategory === subcategory)
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string, presets: Preset[] = BUILTIN_PRESETS): Preset | undefined {
    return presets.find(p => p.id === id)
}

/**
 * Mark preset as recently used
 */
export function markPresetAsUsed(preset: Preset): Preset {
    return {
        ...preset,
        isRecent: true,
        lastUsed: Date.now(),
        useCount: (preset.useCount ?? 0) + 1,
    }
}

/**
 * Get subcategories for a tab
 */
export function getSubcategoriesForTab(tab: PresetTab): string[] {
    if (tab === 'device') {
        return ['apple', 'samsung', 'google', 'sony', 'microsoft']
    }
    if (tab === 'social') {
        return ['youtube', 'tiktok', 'facebook', 'instagram', 'twitch', 'twitter']
    }
    if (tab === 'video') {
        return ['general', 'hd', '4k', 'web', 'streaming']
    }
    if (tab === 'audio') {
        return ['general', 'music', 'podcast', 'audiobook']
    }
    return []
}

/**
 * Get display name for subcategory
 */
export function getSubcategoryDisplayName(subcategory: string): string {
    const names: Record<string, string> = {
        // Device brands
        apple: 'Apple',
        samsung: 'Samsung',
        google: 'Google',
        sony: 'Sony',
        microsoft: 'Microsoft',
        
        // Social platforms
        youtube: 'YouTube',
        tiktok: 'TikTok',
        facebook: 'Facebook',
        instagram: 'Instagram',
        twitch: 'Twitch',
        twitter: 'Twitter',
        
        // Video categories
        general: 'General',
        hd: 'HD Quality',
        '4k': '4K Ultra HD',
        web: 'Web Optimized',
        streaming: 'Streaming',
        
        // Audio categories
        music: 'Music',
        podcast: 'Podcast',
        audiobook: 'Audiobook',
    }
    return names[subcategory] ?? subcategory
}
