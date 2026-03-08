/**
 * Binary Checker Utility
 * 
 * Detects and locates FFmpeg and Pandoc executables across platforms.
 * Search priority:
 * 1. App's executables folder (rootFolder/executables/{platform}/)
 * 2. System PATH
 * 3. Common installation directories
 */

import { app } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { platform } from 'os'

export type BinaryName = 'ffmpeg' | 'ffprobe' | 'pandoc'

interface BinaryInfo {
    path: string | null
    version: string | null
    available: boolean
}

const binaryCache = new Map<BinaryName, BinaryInfo>()

/**
 * Get the platform-specific executable extension
 */
function getExecutableExtension(): string {
    return platform() === 'win32' ? '.exe' : ''
}

/**
 * Get the platform folder name
 */
function getPlatformFolder(): string {
    const os = platform()
    switch (os) {
        case 'win32': return 'windows'
        case 'darwin': return 'macos'
        case 'linux': return 'linux'
        default: return 'linux'
    }
}

/**
 * Get the app's executables directory
 */
function getExecutablesDir(): string {
    const appPath = app.getAppPath()
    // In development: /path/to/project
    // In production: /path/to/app.asar or unpacked app
    const rootFolder = path.dirname(appPath)
    return path.join(rootFolder, 'executables', getPlatformFolder())
}

/**
 * Check if a file exists and is executable
 */
async function isExecutable(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, fs.constants.X_OK)
        return true
    } catch {
        return false
    }
}

/**
 * Search for binary in common locations
 */
async function findBinaryInCommonPaths(binaryName: BinaryName): Promise<string | null> {
    const ext = getExecutableExtension()
    const executableName = `${binaryName}${ext}`
    
    // 1. Check app's executables folder
    const appExecutablesDir = getExecutablesDir()
    const appBinaryPath = path.join(appExecutablesDir, executableName)
    
    console.log(`[binary-checker] Checking app executables: ${appBinaryPath}`)
    if (await isExecutable(appBinaryPath)) {
        console.log(`[binary-checker] Found ${binaryName} in app executables`)
        return appBinaryPath
    }

    // 2. Check if in system PATH (most common case)
    const pathBinary = await checkSystemPath(executableName)
    if (pathBinary) {
        console.log(`[binary-checker] Found ${binaryName} in system PATH`)
        return pathBinary
    }

    // 3. Check common installation directories
    const commonPaths = getCommonInstallPaths(executableName)
    for (const commonPath of commonPaths) {
        if (await isExecutable(commonPath)) {
            console.log(`[binary-checker] Found ${binaryName} at ${commonPath}`)
            return commonPath
        }
    }

    console.warn(`[binary-checker] ${binaryName} not found in any location`)
    return null
}

/**
 * Check if binary exists in system PATH
 */
async function checkSystemPath(executableName: string): Promise<string | null> {
    return new Promise((resolve) => {
        const cmd = platform() === 'win32' ? 'where' : 'which'
        const child = spawn(cmd, [executableName], { shell: true })
        
        let output = ''
        child.stdout.on('data', (data) => {
            output += data.toString()
        })
        
        child.on('close', (code) => {
            if (code === 0 && output.trim()) {
                // Return first line (primary executable)
                const firstPath = output.trim().split('\n')[0]
                resolve(firstPath)
            } else {
                resolve(null)
            }
        })
        
        child.on('error', () => resolve(null))
    })
}

/**
 * Get common installation paths for each platform
 */
function getCommonInstallPaths(executableName: string): string[] {
    const os = platform()
    
    if (os === 'win32') {
        return [
            `C:\\Program Files\\ffmpeg\\bin\\${executableName}`,
            `C:\\Program Files (x86)\\ffmpeg\\bin\\${executableName}`,
            `C:\\ffmpeg\\bin\\${executableName}`,
            `C:\\Program Files\\Pandoc\\${executableName}`,
            `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Programs\\ffmpeg\\bin\\${executableName}`,
        ]
    } else if (os === 'darwin') {
        return [
            `/usr/local/bin/${executableName}`,
            `/opt/homebrew/bin/${executableName}`,
            `/usr/bin/${executableName}`,
            `/Applications/ffmpeg/${executableName}`,
        ]
    } else { // linux
        return [
            `/usr/bin/${executableName}`,
            `/usr/local/bin/${executableName}`,
            `/snap/bin/${executableName}`,
            `/opt/${executableName}`,
        ]
    }
}

/**
 * Get version string from a binary
 */
async function getBinaryVersion(binaryPath: string, binaryName: BinaryName): Promise<string | null> {
    return new Promise((resolve) => {
        const args = binaryName === 'pandoc' ? ['--version'] : ['-version']
        const child = spawn(binaryPath, args)
        
        let output = ''
        child.stdout.on('data', (data) => {
            output += data.toString()
        })
        child.stderr.on('data', (data) => {
            output += data.toString()
        })
        
        child.on('close', (code) => {
            if (code === 0 && output) {
                // Extract version number from output
                const versionMatch = output.match(/version\s+(\d+\.\d+(?:\.\d+)?)/i)
                resolve(versionMatch ? versionMatch[1] : 'unknown')
            } else {
                resolve(null)
            }
        })
        
        child.on('error', () => resolve(null))
        
        // Timeout after 3 seconds
        setTimeout(() => {
            child.kill()
            resolve(null)
        }, 3000)
    })
}

/**
 * Find and cache binary information
 */
export async function findBinary(binaryName: BinaryName): Promise<BinaryInfo> {
    // Check cache first
    if (binaryCache.has(binaryName)) {
        return binaryCache.get(binaryName)!
    }

    console.log(`[binary-checker] Searching for ${binaryName}...`)
    
    const binaryPath = await findBinaryInCommonPaths(binaryName)
    
    if (!binaryPath) {
        const info: BinaryInfo = {
            path: null,
            version: null,
            available: false,
        }
        binaryCache.set(binaryName, info)
        return info
    }

    const version = await getBinaryVersion(binaryPath, binaryName)
    
    const info: BinaryInfo = {
        path: binaryPath,
        version,
        available: true,
    }
    
    console.log(`[binary-checker] ${binaryName} found:`, info)
    binaryCache.set(binaryName, info)
    return info
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
    const info = await findBinary('ffmpeg')
    return info.available
}

/**
 * Check if Pandoc is available
 */
export async function isPandocAvailable(): Promise<boolean> {
    const info = await findBinary('pandoc')
    return info.available
}

/**
 * Get FFmpeg executable path
 */
export async function getFFmpegPath(): Promise<string | null> {
    const info = await findBinary('ffmpeg')
    return info.path
}

/**
 * Get FFprobe executable path
 */
export async function getFFprobePath(): Promise<string | null> {
    const info = await findBinary('ffprobe')
    return info.path
}

/**
 * Get Pandoc executable path
 */
export async function getPandocPath(): Promise<string | null> {
    const info = await findBinary('pandoc')
    return info.path
}

/**
 * Clear the binary cache (useful for re-detection after installation)
 */
export function clearBinaryCache(): void {
    binaryCache.clear()
    console.log('[binary-checker] Binary cache cleared')
}

/**
 * Get all binary statuses at once (for UI display)
 */
export async function getAllBinaryInfo(): Promise<{
    ffmpeg: BinaryInfo
    ffprobe: BinaryInfo
    pandoc: BinaryInfo
}> {
    const [ffmpeg, ffprobe, pandoc] = await Promise.all([
        findBinary('ffmpeg'),
        findBinary('ffprobe'),
        findBinary('pandoc'),
    ])
    
    return { ffmpeg, ffprobe, pandoc }
}

/**
 * Get the executables directory path for manual installation
 */
export function getExecutablesDirectory(): string {
    return getExecutablesDir()
}
