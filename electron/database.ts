import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export interface ConversionRecord {
    id: number
    created_at: number
    source_path: string
    source_name: string
    source_ext: string
    source_size: number
    target_format: string
    output_path: string
    status: 'completed' | 'failed'
    error_message: string | null
    duration_ms: number
}

export interface SettingRecord {
    key: string
    value: string
}

export interface PresetRecord {
    id: string
    name: string
    description: string | null
    category: string
    tab: string
    subcategory: string | null
    icon: string | null
    settings: string // JSON string
    is_built_in: number // SQLite boolean (0 or 1)
    is_recent: number // SQLite boolean (0 or 1)
    last_used: number | null
    use_count: number
    created_at: number
}

export function getDatabase(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.')
    }
    return db
}

export function initDatabase(): void {
    const dbPath = path.join(app.getPath('userData'), 'openconvert.db')
    console.log('[database] Initializing database at:', dbPath)

    db = new Database(dbPath)

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL')

    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS conversions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at INTEGER NOT NULL,
            source_path TEXT NOT NULL,
            source_name TEXT NOT NULL,
            source_ext TEXT NOT NULL,
            source_size INTEGER NOT NULL,
            target_format TEXT NOT NULL,
            output_path TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'completed',
            error_message TEXT,
            duration_ms INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            tab TEXT NOT NULL,
            subcategory TEXT,
            icon TEXT,
            settings TEXT NOT NULL,
            is_built_in INTEGER NOT NULL DEFAULT 0,
            is_recent INTEGER NOT NULL DEFAULT 0,
            last_used INTEGER,
            use_count INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
        CREATE INDEX IF NOT EXISTS idx_presets_tab ON presets(tab);
        CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category);
        CREATE INDEX IF NOT EXISTS idx_presets_recent ON presets(is_recent, last_used DESC);
    `)

    console.log('[database] Database initialized successfully.')
}

// --- Conversion History ---

export function insertConversion(data: Omit<ConversionRecord, 'id'>): ConversionRecord {
    const db = getDatabase()
    const stmt = db.prepare(`
        INSERT INTO conversions (created_at, source_path, source_name, source_ext, source_size, target_format, output_path, status, error_message, duration_ms)
        VALUES (@created_at, @source_path, @source_name, @source_ext, @source_size, @target_format, @output_path, @status, @error_message, @duration_ms)
    `)
    const result = stmt.run(data)
    return { ...data, id: result.lastInsertRowid as number }
}

export function getConversions(limit: number = 50, offset: number = 0): { items: ConversionRecord[], total: number } {
    const db = getDatabase()
    const items = db.prepare(`
        SELECT * FROM conversions ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset) as ConversionRecord[]

    const countResult = db.prepare('SELECT COUNT(*) as count FROM conversions').get() as { count: number }

    return { items, total: countResult.count }
}

export function getConversionsByStatus(status: string, limit: number = 50, offset: number = 0): { items: ConversionRecord[], total: number } {
    const db = getDatabase()
    const items = db.prepare(`
        SELECT * FROM conversions WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(status, limit, offset) as ConversionRecord[]

    const countResult = db.prepare('SELECT COUNT(*) as count FROM conversions WHERE status = ?').get(status) as { count: number }

    return { items, total: countResult.count }
}

export function searchConversions(query: string, limit: number = 50, offset: number = 0): { items: ConversionRecord[], total: number } {
    const db = getDatabase()
    const pattern = `%${query}%`
    const items = db.prepare(`
        SELECT * FROM conversions WHERE source_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(pattern, limit, offset) as ConversionRecord[]

    const countResult = db.prepare('SELECT COUNT(*) as count FROM conversions WHERE source_name LIKE ?').get(pattern) as { count: number }

    return { items, total: countResult.count }
}

export function deleteConversion(id: number): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM conversions WHERE id = ?').run(id)
    return result.changes > 0
}

export function clearAllConversions(): number {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM conversions').run()
    return result.changes
}

export function getConversionStats(): { total: number, completed: number, failed: number } {
    const db = getDatabase()
    const total = (db.prepare('SELECT COUNT(*) as count FROM conversions').get() as { count: number }).count
    const completed = (db.prepare('SELECT COUNT(*) as count FROM conversions WHERE status = ?').get('completed') as { count: number }).count
    const failed = (db.prepare('SELECT COUNT(*) as count FROM conversions WHERE status = ?').get('failed') as { count: number }).count
    return { total, completed, failed }
}

// --- Settings ---

export function getSetting(key: string): string | null {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as SettingRecord | undefined
    return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
    const db = getDatabase()
    db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
}

export function getAllSettings(): Record<string, string> {
    const db = getDatabase()
    const rows = db.prepare('SELECT key, value FROM settings').all() as SettingRecord[]
    const result: Record<string, string> = {}
    for (const row of rows) {
        result[row.key] = row.value
    }
    return result
}

export function deleteSetting(key: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM settings WHERE key = ?').run(key)
    return result.changes > 0
}

export function resetAllSettings(): void {
    const db = getDatabase()
    db.prepare('DELETE FROM settings').run()
}

export function closeDatabase(): void {
    if (db) {
        db.close()
        db = null
        console.log('[database] Database closed.')
    }
}

// --- Analytics ---

export interface AnalyticsData {
    totalConversions: number
    successfulConversions: number
    failedConversions: number
    totalFilesSize: number
    totalDuration: number
    averageDuration: number
    topSourceFormats: Array<{ format: string; count: number }>
    topTargetFormats: Array<{ format: string; count: number }>
    conversionsByCategory: Array<{ category: string; count: number }>
    recentTrend: Array<{ date: string; count: number }>
    fastestConversion: { name: string; duration: number } | null
    slowestConversion: { name: string; duration: number } | null
}

export function getAnalytics(): AnalyticsData {
    const db = getDatabase()

    // Total conversions
    const totalResult = db.prepare('SELECT COUNT(*) as count FROM conversions').get() as { count: number }
    const totalConversions = totalResult.count

    if (totalConversions === 0) {
        return {
            totalConversions: 0,
            successfulConversions: 0,
            failedConversions: 0,
            totalFilesSize: 0,
            totalDuration: 0,
            averageDuration: 0,
            topSourceFormats: [],
            topTargetFormats: [],
            conversionsByCategory: [],
            recentTrend: [],
            fastestConversion: null,
            slowestConversion: null,
        }
    }

    // Success/failure counts
    const successResult = db.prepare('SELECT COUNT(*) as count FROM conversions WHERE status = ?').get('completed') as { count: number }
    const failedResult = db.prepare('SELECT COUNT(*) as count FROM conversions WHERE status = ?').get('failed') as { count: number }

    // Total file size and duration
    const aggregateResult = db.prepare('SELECT SUM(source_size) as total_size, SUM(duration_ms) as total_duration, AVG(duration_ms) as avg_duration FROM conversions').get() as {
        total_size: number | null
        total_duration: number | null
        avg_duration: number | null
    }

    // Top source formats
    const topSourceFormats = db.prepare(`
        SELECT source_ext as format, COUNT(*) as count
        FROM conversions
        GROUP BY source_ext
        ORDER BY count DESC
        LIMIT 10
    `).all() as Array<{ format: string; count: number }>

    // Top target formats
    const topTargetFormats = db.prepare(`
        SELECT target_format as format, COUNT(*) as count
        FROM conversions
        GROUP BY target_format
        ORDER BY count DESC
        LIMIT 10
    `).all() as Array<{ format: string; count: number }>

    // Conversions by category (need to infer from extension)
    // Simplified: group by first letter of extension (not ideal but works without FORMAT_MAP in Node)
    const categoryMap: Record<string, string> = {
        'p': 'image', 'j': 'image', 'g': 'image', 'w': 'image', 'b': 'image', 'a': 'image', 't': 'image', 's': 'image', 'i': 'image',
        'pdf': 'document', 'e': 'document', 'd': 'document', 'r': 'document', 'o': 'document', 'x': 'document', 'c': 'document', 'm': 'document', 'f': 'document',
        'v': 'video',
        'audio': 'audio',
    }
    
    // Get all extensions and manually categorize
    const allExts = db.prepare('SELECT source_ext, COUNT(*) as count FROM conversions GROUP BY source_ext').all() as Array<{ source_ext: string; count: number }>
    const categoryCount: Record<string, number> = { image: 0, document: 0, video: 0, audio: 0 }
    
    for (const ext of allExts) {
        const lower = ext.source_ext.toLowerCase()
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'tiff', 'tif', 'svg', 'ico', 'jxl'].includes(lower)) {
            categoryCount.image += ext.count
        } else if (['pdf', 'epub', 'docx', 'txt', 'rtf', 'odt', 'xps', 'cbz', 'mobi', 'fb2'].includes(lower)) {
            categoryCount.document += ext.count
        } else if (['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv', 'wmv'].includes(lower)) {
            categoryCount.video += ext.count
        } else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'].includes(lower)) {
            categoryCount.audio += ext.count
        }
    }

    const conversionsByCategory = Object.entries(categoryCount)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

    // Recent trend (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentTrend = db.prepare(`
        SELECT DATE(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
        FROM conversions
        WHERE created_at > ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT 7
    `).all(sevenDaysAgo) as Array<{ date: string; count: number }>

    // Fastest and slowest conversions
    const fastestConversion = db.prepare(`
        SELECT source_name as name, duration_ms as duration
        FROM conversions
        WHERE status = 'completed' AND duration_ms > 0
        ORDER BY duration_ms ASC
        LIMIT 1
    `).get() as { name: string; duration: number } | undefined

    const slowestConversion = db.prepare(`
        SELECT source_name as name, duration_ms as duration
        FROM conversions
        WHERE status = 'completed' AND duration_ms > 0
        ORDER BY duration_ms DESC
        LIMIT 1
    `).get() as { name: string; duration: number } | undefined

    return {
        totalConversions,
        successfulConversions: successResult.count,
        failedConversions: failedResult.count,
        totalFilesSize: aggregateResult.total_size ?? 0,
        totalDuration: aggregateResult.total_duration ?? 0,
        averageDuration: aggregateResult.avg_duration ?? 0,
        topSourceFormats,
        topTargetFormats,
        conversionsByCategory,
        recentTrend,
        fastestConversion: fastestConversion ?? null,
        slowestConversion: slowestConversion ?? null,
    }
}

// --- Presets ---

export function insertPreset(data: Omit<PresetRecord, 'created_at'>): PresetRecord {
    const db = getDatabase()
    const stmt = db.prepare(`
        INSERT INTO presets (id, name, description, category, tab, subcategory, icon, settings, is_built_in, is_recent, last_used, use_count, created_at)
        VALUES (@id, @name, @description, @category, @tab, @subcategory, @icon, @settings, @is_built_in, @is_recent, @last_used, @use_count, @created_at)
    `)
    const created_at = Date.now()
    const result = stmt.run({ ...data, created_at })
    return { ...data, created_at }
}

export function getPresets(): PresetRecord[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM presets ORDER BY created_at DESC').all() as PresetRecord[]
}

export function getPresetById(id: string): PresetRecord | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as PresetRecord | undefined
}

export function updatePreset(id: string, data: Partial<Omit<PresetRecord, 'id' | 'created_at'>>): boolean {
    const db = getDatabase()
    const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')
    const stmt = db.prepare(`UPDATE presets SET ${fields} WHERE id = @id`)
    const result = stmt.run({ ...data, id })
    return result.changes > 0
}

export function deletePreset(id: string): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM presets WHERE id = ? AND is_built_in = 0')
    const result = stmt.run(id)
    return result.changes > 0
}

export function markPresetAsUsed(id: string): boolean {
    const db = getDatabase()
    const stmt = db.prepare(`
        UPDATE presets 
        SET is_recent = 1, last_used = ?, use_count = use_count + 1
        WHERE id = ?
    `)
    const result = stmt.run(Date.now(), id)
    return result.changes > 0
}
