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

        CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
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
