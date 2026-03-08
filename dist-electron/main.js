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
const FORMAT_MAP$1 = {
  // ========================================
  // IMAGE FORMATS (✅ SUPPORTED)
  // ========================================
  png: {
    category: "image",
    label: "PNG",
    targets: ["jpg", "webp", "gif", "bmp", "avif", "tiff", "ico", "pdf"],
    description: "Portable Network Graphics - lossless compression with transparency"
  },
  jpg: {
    category: "image",
    label: "JPEG",
    targets: ["png", "webp", "gif", "bmp", "avif", "tiff", "ico", "pdf"],
    description: "Joint Photographic Experts Group - lossy compression, widely supported"
  },
  jpeg: {
    category: "image",
    label: "JPEG",
    targets: ["png", "webp", "gif", "bmp", "avif", "tiff", "ico", "pdf"]
  },
  gif: {
    category: "image",
    label: "GIF",
    targets: ["png", "jpg", "webp", "bmp", "avif", "tiff"],
    description: "Graphics Interchange Format - supports animation and transparency"
  },
  webp: {
    category: "image",
    label: "WebP",
    targets: ["png", "jpg", "gif", "bmp", "avif", "tiff", "ico", "pdf"],
    description: "Modern web format - superior compression, supports transparency and animation"
  },
  bmp: {
    category: "image",
    label: "BMP",
    targets: ["png", "jpg", "webp", "gif", "avif", "tiff"],
    description: "Bitmap - uncompressed, large file sizes"
  },
  avif: {
    category: "image",
    label: "AVIF",
    targets: ["png", "jpg", "webp", "gif", "bmp", "tiff"],
    description: "AV1 Image File Format - best compression, modern browsers only"
  },
  tiff: {
    category: "image",
    label: "TIFF",
    targets: ["png", "jpg", "webp", "gif", "bmp", "avif"],
    description: "Tagged Image File Format - high quality, used in professional photography"
  },
  tif: {
    category: "image",
    label: "TIFF",
    targets: ["png", "jpg", "webp", "gif", "bmp", "avif"]
  },
  svg: {
    category: "image",
    label: "SVG",
    targets: ["png", "jpg", "webp"],
    description: "Scalable Vector Graphics - can be rasterized to PNG/JPG/WebP"
  },
  ico: {
    category: "image",
    label: "ICO",
    targets: ["png", "jpg", "webp"],
    description: "Icon format - typically 16x16, 32x32, or 256x256"
  },
  jxl: {
    category: "image",
    label: "JXL",
    targets: ["png", "jpg", "webp"],
    description: "JPEG XL - next-gen format with excellent compression"
  },
  // ========================================
  // DOCUMENT FORMATS (❌ REQUIRES PANDOC)
  // ========================================
  pdf: {
    category: "document",
    label: "PDF",
    targets: ["png", "jpg", "txt"],
    description: "Portable Document Format - universal document standard"
  },
  epub: {
    category: "document",
    label: "EPUB",
    targets: ["pdf", "txt"],
    description: "Electronic Publication - ebook format"
  },
  docx: {
    category: "document",
    label: "DOCX",
    targets: ["pdf", "txt"],
    description: "Microsoft Word Open XML Document"
  },
  txt: {
    category: "document",
    label: "TXT",
    targets: ["pdf"],
    description: "Plain text file"
  },
  rtf: {
    category: "document",
    label: "RTF",
    targets: ["pdf", "txt"],
    description: "Rich Text Format - cross-platform formatted text"
  },
  odt: {
    category: "document",
    label: "ODT",
    targets: ["pdf", "txt"],
    description: "OpenDocument Text - open standard document format"
  },
  xps: {
    category: "document",
    label: "XPS",
    targets: ["pdf", "png", "jpg"],
    description: "XML Paper Specification - Microsoft document format"
  },
  cbz: {
    category: "document",
    label: "CBZ",
    targets: ["pdf", "png"],
    description: "Comic Book Archive - ZIP compressed images"
  },
  mobi: {
    category: "document",
    label: "MOBI",
    targets: ["pdf", "epub", "txt"],
    description: "Mobipocket eBook - Kindle format"
  },
  fb2: {
    category: "document",
    label: "FB2",
    targets: ["pdf", "epub", "txt"],
    description: "FictionBook - XML-based ebook format"
  },
  // ========================================
  // VIDEO FORMATS (❌ REQUIRES FFMPEG)
  // ========================================
  mp4: {
    category: "video",
    label: "MP4",
    targets: ["mkv", "avi", "mov", "webm", "gif"],
    description: "MPEG-4 Part 14 - most widely supported video format"
  },
  mkv: {
    category: "video",
    label: "MKV",
    targets: ["mp4", "avi", "mov", "webm"],
    description: "Matroska Video - open container format, supports multiple tracks"
  },
  avi: {
    category: "video",
    label: "AVI",
    targets: ["mp4", "mkv", "mov", "webm"],
    description: "Audio Video Interleave - legacy Windows format"
  },
  mov: {
    category: "video",
    label: "MOV",
    targets: ["mp4", "mkv", "avi", "webm"],
    description: "QuickTime Movie - Apple video format"
  },
  webm: {
    category: "video",
    label: "WebM",
    targets: ["mp4", "mkv", "avi", "mov"],
    description: "Web Media - open format optimized for web streaming"
  },
  "3gp": {
    category: "video",
    label: "3GP",
    targets: ["mp4", "mkv", "avi"],
    description: "3rd Generation Partnership Project - mobile video format"
  },
  flv: {
    category: "video",
    label: "FLV",
    targets: ["mp4", "mkv", "avi", "webm"],
    description: "Flash Video - legacy web video format"
  },
  wmv: {
    category: "video",
    label: "WMV",
    targets: ["mp4", "mkv", "avi", "webm"],
    description: "Windows Media Video - Microsoft streaming format"
  },
  // ========================================
  // AUDIO FORMATS (❌ REQUIRES FFMPEG)
  // ========================================
  mp3: {
    category: "audio",
    label: "MP3",
    targets: ["wav", "aac", "ogg", "flac", "m4a"],
    description: "MPEG Audio Layer III - most popular lossy audio format"
  },
  wav: {
    category: "audio",
    label: "WAV",
    targets: ["mp3", "aac", "ogg", "flac", "m4a"],
    description: "Waveform Audio - uncompressed, high quality"
  },
  aac: {
    category: "audio",
    label: "AAC",
    targets: ["mp3", "wav", "ogg", "flac", "m4a"],
    description: "Advanced Audio Coding - better quality than MP3 at same bitrate"
  },
  ogg: {
    category: "audio",
    label: "OGG",
    targets: ["mp3", "wav", "aac", "flac", "m4a"],
    description: "Ogg Vorbis - free, open-source audio format"
  },
  flac: {
    category: "audio",
    label: "FLAC",
    targets: ["mp3", "wav", "aac", "ogg", "m4a"],
    description: "Free Lossless Audio Codec - compressed but lossless"
  },
  wma: {
    category: "audio",
    label: "WMA",
    targets: ["mp3", "wav", "aac", "ogg", "flac"],
    description: "Windows Media Audio - Microsoft audio format"
  },
  m4a: {
    category: "audio",
    label: "M4A",
    targets: ["mp3", "wav", "aac", "ogg", "flac"],
    description: "MPEG-4 Audio - typically AAC in MP4 container"
  }
};
const FORMAT_MAP = FORMAT_MAP$1;
function getAllSupportedExtensions() {
  return Object.keys(FORMAT_MAP);
}
function getExtensionsByCategory(category) {
  return Object.entries(FORMAT_MAP).filter(([_, info]) => info.category === category).map(([ext, _]) => ext);
}
function getFileDialogFilters() {
  return [
    {
      name: "Supported Files",
      extensions: getAllSupportedExtensions()
    },
    {
      name: "Images",
      extensions: getExtensionsByCategory("image")
    },
    {
      name: "Documents",
      extensions: getExtensionsByCategory("document")
    },
    {
      name: "Video",
      extensions: getExtensionsByCategory("video")
    },
    {
      name: "Audio",
      extensions: getExtensionsByCategory("audio")
    },
    {
      name: "All Files",
      extensions: ["*"]
    }
  ];
}
function getConverterCategory(ext) {
  const format = FORMAT_MAP[ext.toLowerCase()];
  return format?.category ?? null;
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
    filters: getFileDialogFilters()
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
