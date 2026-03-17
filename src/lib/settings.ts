// Settings schema and defaults for OpenConvert

export interface AppSettings {
    defaultOutputDir: string | null
    conversionQuality: QualityPreset
    concurrency: number
    autoOpenFolder: boolean
    overwriteBehavior: OverwriteBehavior
    theme: ThemeOption
    showAdvancedSettings: boolean
    maxFileCount: number
    maxFileSizeMB: number
    postConversionAction: PostConversionAction
}

export type QualityPreset = 'low' | 'medium' | 'high' | 'lossless'
export type OverwriteBehavior = 'skip' | 'rename' | 'overwrite'
export type ThemeOption = 'light' | 'dark' | 'system'
export type PostConversionAction = 'none' | 'notification' | 'open-folder' | 'shutdown'

export const DEFAULT_SETTINGS: AppSettings = {
    defaultOutputDir: null,
    conversionQuality: 'high',
    concurrency: 3,
    autoOpenFolder: false,
    overwriteBehavior: 'rename',
    theme: 'dark',
    showAdvancedSettings: false,
    maxFileCount: 100,
    maxFileSizeMB: 500,
    postConversionAction: 'none',
}

export const QUALITY_LABELS: Record<QualityPreset, { label: string; description: string }> = {
    low: { label: 'Low', description: 'Smallest file size, reduced quality' },
    medium: { label: 'Medium', description: 'Balanced file size and quality' },
    high: { label: 'High', description: 'Large file size, best quality' },
    lossless: { label: 'Lossless', description: 'No quality loss, largest file size' },
}

export const QUALITY_VALUES: Record<QualityPreset, number> = {
    low: 60,
    medium: 80,
    high: 90,
    lossless: 100,
}

export const OVERWRITE_LABELS: Record<OverwriteBehavior, { label: string; description: string }> = {
    skip: { label: 'Skip', description: 'Skip files that already exist' },
    rename: { label: 'Auto-rename', description: 'Add number suffix to avoid conflicts' },
    overwrite: { label: 'Overwrite', description: 'Replace existing files' },
}

export const THEME_LABELS: Record<ThemeOption, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
}

export const POST_CONVERSION_ACTION_LABELS: Record<PostConversionAction, { label: string; description: string }> = {
    none: { label: 'Do Nothing', description: 'No action after conversion' },
    notification: { label: 'Send Notification', description: 'Show desktop notification when done' },
    'open-folder': { label: 'Open Folder', description: 'Open output folder when done' },
    shutdown: { label: 'Turn Off PC', description: 'Shutdown computer when done' },
}

/** Serialize settings to a flat key-value map for storage */
export function serializeSettings(settings: AppSettings): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(settings)) {
        result[key] = JSON.stringify(value)
    }
    return result
}

/** Deserialize settings from a flat key-value map */
export function deserializeSettings(raw: Record<string, string>): AppSettings {
    const settings = { ...DEFAULT_SETTINGS }
    for (const [key, value] of Object.entries(raw)) {
        if (key in settings) {
            try {
                (settings as Record<string, unknown>)[key] = JSON.parse(value)
            } catch {
                // Keep default value if parsing fails
            }
        }
    }
    return settings
}
