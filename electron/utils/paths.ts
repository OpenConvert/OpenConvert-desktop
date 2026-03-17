import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get the path to the examples/images folder
 * Works in both development and packaged modes
 */
export function getExamplesPath(): string {
    if (app.isPackaged) {
        // In production: examples are in resources folder
        return path.join(process.resourcesPath, 'examples', 'images')
    }
    // In development: examples are in project root
    return path.join(__dirname, '../../examples/images')
}

/**
 * Get the path to the demo outputs folder
 * Creates the directory if it doesn't exist
 */
export function getDemoOutputPath(): string {
    const demoPath = path.join(app.getPath('userData'), 'demo-outputs')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(demoPath)) {
        fs.mkdirSync(demoPath, { recursive: true })
    }
    
    return demoPath
}
