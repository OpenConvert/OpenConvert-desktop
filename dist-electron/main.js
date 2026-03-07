import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import Database from "better-sqlite3";
import sharp from "sharp";
let db = null;
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "openconvert.db");
  console.log("[database] Initializing database at:", dbPath);
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
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
    `);
  console.log("[database] Database initialized successfully.");
}
function insertConversion(data) {
  const db2 = getDatabase();
  const stmt = db2.prepare(`
        INSERT INTO conversions (created_at, source_path, source_name, source_ext, source_size, target_format, output_path, status, error_message, duration_ms)
        VALUES (@created_at, @source_path, @source_name, @source_ext, @source_size, @target_format, @output_path, @status, @error_message, @duration_ms)
    `);
  const result = stmt.run(data);
  return { ...data, id: result.lastInsertRowid };
}
function getConversions(limit = 50, offset = 0) {
  const db2 = getDatabase();
  const items = db2.prepare(`
        SELECT * FROM conversions ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
  const countResult = db2.prepare("SELECT COUNT(*) as count FROM conversions").get();
  return { items, total: countResult.count };
}
function getConversionsByStatus(status, limit = 50, offset = 0) {
  const db2 = getDatabase();
  const items = db2.prepare(`
        SELECT * FROM conversions WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(status, limit, offset);
  const countResult = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get(status);
  return { items, total: countResult.count };
}
function searchConversions(query, limit = 50, offset = 0) {
  const db2 = getDatabase();
  const pattern = `%${query}%`;
  const items = db2.prepare(`
        SELECT * FROM conversions WHERE source_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(pattern, limit, offset);
  const countResult = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE source_name LIKE ?").get(pattern);
  return { items, total: countResult.count };
}
function deleteConversion(id) {
  const db2 = getDatabase();
  const result = db2.prepare("DELETE FROM conversions WHERE id = ?").run(id);
  return result.changes > 0;
}
function clearAllConversions() {
  const db2 = getDatabase();
  const result = db2.prepare("DELETE FROM conversions").run();
  return result.changes;
}
function getConversionStats() {
  const db2 = getDatabase();
  const total = db2.prepare("SELECT COUNT(*) as count FROM conversions").get().count;
  const completed = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("completed").count;
  const failed = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("failed").count;
  return { total, completed, failed };
}
function getSetting(key) {
  const db2 = getDatabase();
  const row = db2.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setSetting(key, value) {
  const db2 = getDatabase();
  db2.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
}
function getAllSettings() {
  const db2 = getDatabase();
  const rows = db2.prepare("SELECT key, value FROM settings").all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
function resetAllSettings() {
  const db2 = getDatabase();
  db2.prepare("DELETE FROM settings").run();
}
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("[database] Database closed.");
  }
}
const SHARP_FORMATS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "tiff", "tif", "jxl"];
const SPECIAL_INPUT_FORMATS = ["svg", "ico", "bmp"];
function isImageFormat(ext) {
  const lower = ext.toLowerCase();
  return [...SHARP_FORMATS, ...SPECIAL_INPUT_FORMATS].includes(lower);
}
async function resolveOutputPath(outputDir, baseName, targetFormat, overwriteBehavior) {
  const ext = targetFormat === "jpg" ? "jpg" : targetFormat;
  const outputPath = path.join(outputDir, `${baseName}.${ext}`);
  try {
    await fs.access(outputPath);
    if (overwriteBehavior === "overwrite") {
      return { path: outputPath, skip: false };
    }
    if (overwriteBehavior === "skip") {
      return { path: outputPath, skip: true };
    }
    let counter = 1;
    let newPath;
    do {
      newPath = path.join(outputDir, `${baseName} (${counter}).${ext}`);
      counter++;
      try {
        await fs.access(newPath);
      } catch {
        return { path: newPath, skip: false };
      }
    } while (counter < 1e4);
    return { path: newPath, skip: false };
  } catch {
    return { path: outputPath, skip: false };
  }
}
function getBaseName(filePath) {
  const name = path.basename(filePath);
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1) return name;
  return name.substring(0, lastDot);
}
async function convertImage(options) {
  const startTime = Date.now();
  const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior } = options;
  try {
    await fs.access(sourcePath);
    await fs.mkdir(outputDir, { recursive: true });
    const baseName = getBaseName(sourcePath);
    const { path: outputPath, skip } = await resolveOutputPath(
      outputDir,
      baseName,
      targetFormat,
      overwriteBehavior
    );
    if (skip) {
      return {
        success: true,
        outputPath,
        durationMs: Date.now() - startTime
      };
    }
    let pipeline = sharp(sourcePath, {
      animated: false,
      // Don't process animated frames for conversion
      failOn: "none"
      // Don't fail on minor image issues
    });
    const format = targetFormat.toLowerCase();
    switch (format) {
      case "png":
        pipeline = pipeline.png({
          quality,
          compressionLevel: quality >= 90 ? 6 : quality >= 60 ? 7 : 9
        });
        break;
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality,
          mozjpeg: true
          // Better compression
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality,
          lossless: quality >= 100
        });
        break;
      case "avif":
        pipeline = pipeline.avif({
          quality,
          lossless: quality >= 100
        });
        break;
      case "gif":
        pipeline = pipeline.gif();
        break;
      case "tiff":
      case "tif":
        pipeline = pipeline.tiff({
          quality,
          compression: "lzw"
        });
        break;
      case "jxl":
        pipeline = pipeline.jxl({
          quality,
          lossless: quality >= 100
        });
        break;
      case "bmp":
        pipeline = pipeline.png({ compressionLevel: 0 });
        break;
      case "ico":
        pipeline = pipeline.resize(256, 256, { fit: "inside", withoutEnlargement: true }).png();
        break;
      case "pdf":
        return {
          success: false,
          outputPath: "",
          error: "Image to PDF conversion is not yet supported. A document converter is required.",
          durationMs: Date.now() - startTime
        };
      default:
        return {
          success: false,
          outputPath: "",
          error: `Unsupported target format: ${format}`,
          durationMs: Date.now() - startTime
        };
    }
    await pipeline.toFile(outputPath);
    return {
      success: true,
      outputPath,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[image-converter] Failed to convert ${sourcePath}:`, errorMessage);
    return {
      success: false,
      outputPath: "",
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}
async function generateThumbnail(filePath, size = 128) {
  try {
    const buffer = await sharp(filePath, {
      failOn: "none"
    }).resize(size, size, {
      fit: "cover",
      position: "centre"
    }).png({ quality: 70, compressionLevel: 9 }).toBuffer();
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error(`[image-converter] Failed to generate thumbnail for ${filePath}:`, err);
    return null;
  }
}
const IMAGE_FORMATS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "avif",
  "tiff",
  "tif",
  "svg",
  "ico",
  "jxl"
]);
const DOCUMENT_FORMATS = /* @__PURE__ */ new Set([
  "pdf",
  "epub",
  "xps",
  "cbz",
  "mobi",
  "fb2",
  "docx",
  "txt",
  "rtf",
  "odt"
]);
const VIDEO_FORMATS = /* @__PURE__ */ new Set([
  "mp4",
  "mkv",
  "avi",
  "mov",
  "webm",
  "3gp",
  "flv",
  "wmv"
]);
const AUDIO_FORMATS = /* @__PURE__ */ new Set([
  "mp3",
  "wav",
  "aac",
  "ogg",
  "flac",
  "wma",
  "m4a"
]);
function getConverterCategory(ext) {
  const lower = ext.toLowerCase();
  if (IMAGE_FORMATS.has(lower)) return "image";
  if (DOCUMENT_FORMATS.has(lower)) return "document";
  if (VIDEO_FORMATS.has(lower)) return "video";
  if (AUDIO_FORMATS.has(lower)) return "audio";
  return null;
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true
    }
  });
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximized-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-maximized-changed", false);
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  console.log("[main] isDev:", isDev);
  console.log("[main] VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    console.log("[main] Dev server URL loaded.");
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  let devToolsWindow = null;
  ipcMain.removeAllListeners("toggle-dev-tools");
  ipcMain.on("toggle-dev-tools", () => {
    console.log("[main] toggle-dev-tools IPC received");
    if (!mainWindow) return;
    if (mainWindow.webContents.isDevToolsOpened()) {
      console.log("[main] Closing DevTools");
      mainWindow.webContents.closeDevTools();
      if (devToolsWindow && !devToolsWindow.isDestroyed()) {
        devToolsWindow.close();
      }
      devToolsWindow = null;
    } else {
      console.log("[main] Opening Custom DevTools Window");
      if (!devToolsWindow || devToolsWindow.isDestroyed()) {
        devToolsWindow = new BrowserWindow({
          width: 800,
          height: 600,
          title: "OpenConvert Developer Tools"
        });
        devToolsWindow.on("closed", () => {
          devToolsWindow = null;
        });
      }
      mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents);
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });
}
app.whenReady().then(() => {
  initDatabase();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", () => {
  closeDatabase();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.handle("open-file-dialog", async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Supported Files",
        extensions: [
          "png",
          "jpg",
          "jpeg",
          "gif",
          "webp",
          "bmp",
          "avif",
          "tiff",
          "tif",
          "svg",
          "ico",
          "jxl",
          "pdf",
          "epub",
          "xps",
          "cbz",
          "mobi",
          "fb2",
          "docx",
          "txt",
          "rtf",
          "odt",
          "mp4",
          "mkv",
          "avi",
          "mov",
          "webm",
          "3gp",
          "flv",
          "wmv",
          "mp3",
          "wav",
          "aac",
          "ogg",
          "flac",
          "wma",
          "m4a"
        ]
      },
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "avif", "tiff", "tif", "svg", "ico", "jxl"] },
      { name: "Documents", extensions: ["pdf", "epub", "xps", "cbz", "mobi", "fb2", "docx", "txt", "rtf", "odt"] },
      { name: "Video", extensions: ["mp4", "mkv", "avi", "mov", "webm", "3gp", "flv", "wmv"] },
      { name: "Audio", extensions: ["mp3", "wav", "aac", "ogg", "flac", "wma", "m4a"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (result.canceled) return [];
  const fileInfos = await Promise.all(
    result.filePaths.map(async (filePath) => {
      const stat = await fs.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        ext: path.extname(filePath).slice(1).toLowerCase(),
        size: stat.size
      };
    })
  );
  return fileInfos;
});
ipcMain.handle("select-output-dir", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});
ipcMain.handle("get-file-info", async (_event, filePath) => {
  try {
    const stat = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      ext: path.extname(filePath).slice(1).toLowerCase(),
      size: stat.size
    };
  } catch {
    return null;
  }
});
async function processWithConcurrency(items, concurrency, processor) {
  const results = [];
  const executing = /* @__PURE__ */ new Set();
  for (const item of items) {
    const promise = (async () => {
      const result = await processor(item);
      results.push(result);
    })();
    executing.add(promise);
    promise.finally(() => executing.delete(promise));
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}
ipcMain.handle("convert-files", async (_event, payload) => {
  console.log("[main] Received conversion payload:", JSON.stringify(payload, null, 2));
  const {
    targetDirectory,
    filesToConvert,
    quality = 90,
    concurrency = 3,
    overwriteBehavior = "rename"
  } = payload;
  const results = [];
  await processWithConcurrency(filesToConvert, concurrency, async (file) => {
    const category = getConverterCategory(file.sourceExt);
    mainWindow?.webContents.send("conversion-progress", {
      fileId: file.fileId,
      progress: 10,
      status: "converting"
    });
    let result;
    if (category === "image" && isImageFormat(file.sourceExt)) {
      mainWindow?.webContents.send("conversion-progress", {
        fileId: file.fileId,
        progress: 30,
        status: "converting"
      });
      result = await convertImage({
        sourcePath: file.sourcePath,
        outputDir: targetDirectory,
        targetFormat: file.targetFormat,
        quality,
        overwriteBehavior
      });
      mainWindow?.webContents.send("conversion-progress", {
        fileId: file.fileId,
        progress: 90,
        status: "converting"
      });
    } else if (category === "document") {
      result = {
        success: false,
        outputPath: "",
        error: "Document conversion requires Pandoc to be installed. Please install Pandoc (https://pandoc.org) and try again.",
        durationMs: 0
      };
    } else if (category === "video") {
      result = {
        success: false,
        outputPath: "",
        error: "Video conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.",
        durationMs: 0
      };
    } else if (category === "audio") {
      result = {
        success: false,
        outputPath: "",
        error: "Audio conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.",
        durationMs: 0
      };
    } else {
      result = {
        success: false,
        outputPath: "",
        error: `Unsupported file format: .${file.sourceExt}`,
        durationMs: 0
      };
    }
    try {
      insertConversion({
        created_at: Date.now(),
        source_path: file.sourcePath,
        source_name: file.sourceName,
        source_ext: file.sourceExt,
        source_size: file.sourceSize,
        target_format: file.targetFormat,
        output_path: result.outputPath || "",
        status: result.success ? "completed" : "failed",
        error_message: result.error ?? null,
        duration_ms: result.durationMs
      });
    } catch (dbErr) {
      console.error("[main] Failed to save conversion history:", dbErr);
    }
    mainWindow?.webContents.send("conversion-progress", {
      fileId: file.fileId,
      progress: 100,
      status: result.success ? "done" : "error",
      error: result.error
    });
    results.push({
      fileId: file.fileId,
      success: result.success,
      outputPath: result.outputPath,
      error: result.error
    });
  });
  return { success: true, results };
});
ipcMain.handle("generate-thumbnail", async (_event, filePath) => {
  try {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (!isImageFormat(ext)) return null;
    return await generateThumbnail(filePath, 128);
  } catch {
    return null;
  }
});
ipcMain.handle("get-history", async (_event, options) => {
  const { limit = 50, offset = 0, status, search } = options;
  if (search && search.trim().length > 0) {
    return searchConversions(search.trim(), limit, offset);
  }
  if (status && status !== "all") {
    return getConversionsByStatus(status, limit, offset);
  }
  return getConversions(limit, offset);
});
ipcMain.handle("get-history-stats", async () => {
  return getConversionStats();
});
ipcMain.handle("delete-history-item", async (_event, id) => {
  return deleteConversion(id);
});
ipcMain.handle("clear-history", async () => {
  return clearAllConversions();
});
ipcMain.handle("show-in-folder", async (_event, filePath) => {
  shell.showItemInFolder(filePath);
  return true;
});
ipcMain.handle("get-settings", async () => {
  return getAllSettings();
});
ipcMain.handle("get-setting", async (_event, key) => {
  return getSetting(key);
});
ipcMain.handle("update-setting", async (_event, key, value) => {
  setSetting(key, value);
  return true;
});
ipcMain.handle("reset-settings", async () => {
  resetAllSettings();
  return true;
});
ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});
ipcMain.handle("get-app-path", async (_event, name) => {
  try {
    return app.getPath(name);
  } catch {
    return null;
  }
});
ipcMain.handle("open-external", async (_event, url) => {
  await shell.openExternal(url);
  return true;
});
