import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import Database from "better-sqlite3";
import sharp from "sharp";
import { spawn } from "child_process";
import { platform } from "os";
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
function getAnalytics() {
  const db2 = getDatabase();
  const totalResult = db2.prepare("SELECT COUNT(*) as count FROM conversions").get();
  const totalConversions = totalResult.count;
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
      slowestConversion: null
    };
  }
  const successResult = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("completed");
  const failedResult = db2.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("failed");
  const aggregateResult = db2.prepare("SELECT SUM(source_size) as total_size, SUM(duration_ms) as total_duration, AVG(duration_ms) as avg_duration FROM conversions").get();
  const topSourceFormats = db2.prepare(`
        SELECT source_ext as format, COUNT(*) as count
        FROM conversions
        GROUP BY source_ext
        ORDER BY count DESC
        LIMIT 10
    `).all();
  const topTargetFormats = db2.prepare(`
        SELECT target_format as format, COUNT(*) as count
        FROM conversions
        GROUP BY target_format
        ORDER BY count DESC
        LIMIT 10
    `).all();
  const allExts = db2.prepare("SELECT source_ext, COUNT(*) as count FROM conversions GROUP BY source_ext").all();
  const categoryCount = { image: 0, document: 0, video: 0, audio: 0 };
  for (const ext of allExts) {
    const lower = ext.source_ext.toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "avif", "tiff", "tif", "svg", "ico", "jxl"].includes(lower)) {
      categoryCount.image += ext.count;
    } else if (["pdf", "epub", "docx", "txt", "rtf", "odt", "xps", "cbz", "mobi", "fb2"].includes(lower)) {
      categoryCount.document += ext.count;
    } else if (["mp4", "mkv", "avi", "mov", "webm", "3gp", "flv", "wmv"].includes(lower)) {
      categoryCount.video += ext.count;
    } else if (["mp3", "wav", "aac", "ogg", "flac", "wma", "m4a"].includes(lower)) {
      categoryCount.audio += ext.count;
    }
  }
  const conversionsByCategory = Object.entries(categoryCount).filter(([_, count]) => count > 0).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const recentTrend = db2.prepare(`
        SELECT DATE(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
        FROM conversions
        WHERE created_at > ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT 7
    `).all(sevenDaysAgo);
  const fastestConversion = db2.prepare(`
        SELECT source_name as name, duration_ms as duration
        FROM conversions
        WHERE status = 'completed' AND duration_ms > 0
        ORDER BY duration_ms ASC
        LIMIT 1
    `).get();
  const slowestConversion = db2.prepare(`
        SELECT source_name as name, duration_ms as duration
        FROM conversions
        WHERE status = 'completed' AND duration_ms > 0
        ORDER BY duration_ms DESC
        LIMIT 1
    `).get();
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
    slowestConversion: slowestConversion ?? null
  };
}
const SHARP_FORMATS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "tiff", "tif", "jxl"];
const SPECIAL_INPUT_FORMATS = ["svg", "ico", "bmp"];
function isImageFormat(ext) {
  const lower = ext.toLowerCase();
  return [...SHARP_FORMATS, ...SPECIAL_INPUT_FORMATS].includes(lower);
}
async function resolveOutputPath$3(outputDir, baseName, targetFormat, overwriteBehavior) {
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
function getBaseName$3(filePath) {
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
    const baseName = getBaseName$3(sourcePath);
    const { path: outputPath, skip } = await resolveOutputPath$3(
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
async function generateThumbnail$1(filePath, size = 128) {
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
const binaryCache = /* @__PURE__ */ new Map();
function getExecutableExtension() {
  return platform() === "win32" ? ".exe" : "";
}
function getPlatformFolder() {
  const os = platform();
  switch (os) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    default:
      return "linux";
  }
}
function getExecutablesDir() {
  const appPath = app.getAppPath();
  const rootFolder = path.dirname(appPath);
  return path.join(rootFolder, "executables", getPlatformFolder());
}
async function isExecutable(filePath) {
  try {
    await fs.access(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
async function findBinaryInCommonPaths(binaryName) {
  const ext = getExecutableExtension();
  const executableName = `${binaryName}${ext}`;
  const appExecutablesDir = getExecutablesDir();
  const appBinaryPath = path.join(appExecutablesDir, executableName);
  console.log(`[binary-checker] Checking app executables: ${appBinaryPath}`);
  if (await isExecutable(appBinaryPath)) {
    console.log(`[binary-checker] Found ${binaryName} in app executables`);
    return appBinaryPath;
  }
  const pathBinary = await checkSystemPath(executableName);
  if (pathBinary) {
    console.log(`[binary-checker] Found ${binaryName} in system PATH`);
    return pathBinary;
  }
  const commonPaths = getCommonInstallPaths(executableName);
  for (const commonPath of commonPaths) {
    if (await isExecutable(commonPath)) {
      console.log(`[binary-checker] Found ${binaryName} at ${commonPath}`);
      return commonPath;
    }
  }
  console.warn(`[binary-checker] ${binaryName} not found in any location`);
  return null;
}
async function checkSystemPath(executableName) {
  return new Promise((resolve) => {
    const cmd = platform() === "win32" ? "where" : "which";
    const child = spawn(cmd, [executableName], { shell: true });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0 && output.trim()) {
        const firstPath = output.trim().split("\n")[0];
        resolve(firstPath);
      } else {
        resolve(null);
      }
    });
    child.on("error", () => resolve(null));
  });
}
function getCommonInstallPaths(executableName) {
  const os = platform();
  if (os === "win32") {
    return [
      `C:\\Program Files\\ffmpeg\\bin\\${executableName}`,
      `C:\\Program Files (x86)\\ffmpeg\\bin\\${executableName}`,
      `C:\\ffmpeg\\bin\\${executableName}`,
      `C:\\Program Files\\Pandoc\\${executableName}`,
      `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Programs\\ffmpeg\\bin\\${executableName}`
    ];
  } else if (os === "darwin") {
    return [
      `/usr/local/bin/${executableName}`,
      `/opt/homebrew/bin/${executableName}`,
      `/usr/bin/${executableName}`,
      `/Applications/ffmpeg/${executableName}`
    ];
  } else {
    return [
      `/usr/bin/${executableName}`,
      `/usr/local/bin/${executableName}`,
      `/snap/bin/${executableName}`,
      `/opt/${executableName}`
    ];
  }
}
async function getBinaryVersion(binaryPath, binaryName) {
  return new Promise((resolve) => {
    const args = binaryName === "pandoc" ? ["--version"] : ["-version"];
    const child = spawn(binaryPath, args);
    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      output += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0 && output) {
        const versionMatch = output.match(/version\s+(\d+\.\d+(?:\.\d+)?)/i);
        resolve(versionMatch ? versionMatch[1] : "unknown");
      } else {
        resolve(null);
      }
    });
    child.on("error", () => resolve(null));
    setTimeout(() => {
      child.kill();
      resolve(null);
    }, 3e3);
  });
}
async function findBinary(binaryName) {
  if (binaryCache.has(binaryName)) {
    return binaryCache.get(binaryName);
  }
  console.log(`[binary-checker] Searching for ${binaryName}...`);
  const binaryPath = await findBinaryInCommonPaths(binaryName);
  if (!binaryPath) {
    const info2 = {
      path: null,
      version: null,
      available: false
    };
    binaryCache.set(binaryName, info2);
    return info2;
  }
  const version = await getBinaryVersion(binaryPath, binaryName);
  const info = {
    path: binaryPath,
    version,
    available: true
  };
  console.log(`[binary-checker] ${binaryName} found:`, info);
  binaryCache.set(binaryName, info);
  return info;
}
async function isFFmpegAvailable() {
  const info = await findBinary("ffmpeg");
  return info.available;
}
async function isPandocAvailable() {
  const info = await findBinary("pandoc");
  return info.available;
}
async function getFFmpegPath() {
  const info = await findBinary("ffmpeg");
  return info.path;
}
async function getFFprobePath() {
  const info = await findBinary("ffprobe");
  return info.path;
}
async function getPandocPath() {
  const info = await findBinary("pandoc");
  return info.path;
}
function clearBinaryCache() {
  binaryCache.clear();
  console.log("[binary-checker] Binary cache cleared");
}
async function getAllBinaryInfo() {
  const [ffmpeg, ffprobe, pandoc] = await Promise.all([
    findBinary("ffmpeg"),
    findBinary("ffprobe"),
    findBinary("pandoc")
  ]);
  return { ffmpeg, ffprobe, pandoc };
}
function getExecutablesDirectory() {
  return getExecutablesDir();
}
const binaryChecker = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clearBinaryCache,
  findBinary,
  getAllBinaryInfo,
  getExecutablesDirectory,
  getFFmpegPath,
  getFFprobePath,
  getPandocPath,
  isFFmpegAvailable,
  isPandocAvailable
}, Symbol.toStringTag, { value: "Module" }));
async function probeMediaFile(filePath) {
  const ffprobePath = await getFFprobePath();
  if (!ffprobePath) {
    console.error("[ffmpeg-wrapper] ffprobe not available");
    return null;
  }
  return new Promise((resolve) => {
    const args = [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath
    ];
    const child = spawn(ffprobePath, args);
    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) {
        console.error("[ffmpeg-wrapper] ffprobe failed");
        resolve(null);
        return;
      }
      try {
        const data = JSON.parse(output);
        const videoStream = data.streams?.find((s) => s.codec_type === "video");
        const audioStream = data.streams?.find((s) => s.codec_type === "audio");
        const info = {
          duration: parseFloat(data.format?.duration || "0"),
          width: videoStream?.width,
          height: videoStream?.height,
          videoCodec: videoStream?.codec_name,
          audioCodec: audioStream?.codec_name,
          bitrate: parseInt(data.format?.bit_rate || "0"),
          format: data.format?.format_name
        };
        resolve(info);
      } catch (err) {
        console.error("[ffmpeg-wrapper] Failed to parse ffprobe output:", err);
        resolve(null);
      }
    });
    child.on("error", (err) => {
      console.error("[ffmpeg-wrapper] ffprobe error:", err);
      resolve(null);
    });
  });
}
function parseFFmpegProgress(line, totalDuration) {
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (!timeMatch) return null;
  const [_, hours, minutes, seconds] = timeMatch;
  const currentSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  if (totalDuration <= 0) return 0;
  const percent = Math.min(100, currentSeconds / totalDuration * 100);
  return Math.round(percent);
}
function buildFFmpegArgs(options) {
  const { inputPath, outputPath, format, quality, isVideo } = options;
  const args = ["-i", inputPath, "-y"];
  let crf;
  let preset;
  let audioBitrate;
  if (quality >= 90) {
    crf = quality >= 95 ? 0 : 18;
    preset = "slow";
    audioBitrate = "192k";
  } else if (quality >= 70) {
    crf = 23;
    preset = "medium";
    audioBitrate = "128k";
  } else {
    crf = 28;
    preset = "fast";
    audioBitrate = "96k";
  }
  if (isVideo) {
    switch (format.toLowerCase()) {
      case "mp4":
        args.push("-c:v", "libx264", "-crf", crf.toString(), "-preset", preset);
        args.push("-c:a", "aac", "-b:a", audioBitrate);
        break;
      case "mkv":
        args.push("-c:v", "libx264", "-crf", crf.toString(), "-preset", preset);
        args.push("-c:a", "aac", "-b:a", audioBitrate);
        break;
      case "webm":
        args.push("-c:v", "libvpx-vp9", "-crf", crf.toString(), "-b:v", "0");
        args.push("-c:a", "libopus", "-b:a", audioBitrate);
        break;
      case "avi":
        args.push("-c:v", "mpeg4", "-qscale:v", Math.floor((100 - quality) / 10).toString());
        args.push("-c:a", "libmp3lame", "-b:a", audioBitrate);
        break;
      case "mov":
        args.push("-c:v", "libx264", "-crf", crf.toString(), "-preset", preset);
        args.push("-c:a", "aac", "-b:a", audioBitrate);
        break;
      case "gif":
        args.push("-vf", "fps=10,scale=480:-1:flags=lanczos");
        args.push("-c:v", "gif");
        break;
      case "3gp":
        args.push("-c:v", "h263", "-c:a", "aac", "-b:a", "64k");
        args.push("-s", "352x288");
        break;
      case "flv":
        args.push("-c:v", "flv", "-c:a", "libmp3lame", "-b:a", audioBitrate);
        break;
      case "wmv":
        args.push("-c:v", "wmv2", "-c:a", "wmav2", "-b:a", audioBitrate);
        break;
      default:
        args.push("-c:v", "libx264", "-crf", crf.toString());
        args.push("-c:a", "aac", "-b:a", audioBitrate);
    }
  } else {
    switch (format.toLowerCase()) {
      case "mp3":
        args.push("-c:a", "libmp3lame", "-b:a", audioBitrate);
        break;
      case "aac":
      case "m4a":
        args.push("-c:a", "aac", "-b:a", audioBitrate);
        break;
      case "ogg":
        args.push("-c:a", "libvorbis", "-q:a", Math.floor(quality / 20).toString());
        break;
      case "flac":
        args.push("-c:a", "flac");
        break;
      case "wav":
        args.push("-c:a", "pcm_s16le");
        break;
      case "wma":
        args.push("-c:a", "wmav2", "-b:a", audioBitrate);
        break;
      default:
        args.push("-c:a", "aac", "-b:a", audioBitrate);
    }
  }
  args.push(outputPath);
  return args;
}
async function executeFFmpeg(options) {
  const ffmpegPath = await getFFmpegPath();
  if (!ffmpegPath) {
    return {
      success: false,
      error: "FFmpeg not available. Please install FFmpeg first."
    };
  }
  const mediaInfo = await probeMediaFile(options.inputPath);
  const totalDuration = mediaInfo?.duration || 0;
  const isVideo = !!mediaInfo?.videoCodec;
  const args = buildFFmpegArgs({
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    format: options.format,
    quality: options.quality,
    isVideo
  });
  console.log("[ffmpeg-wrapper] Executing:", ffmpegPath, args.join(" "));
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath, args);
    let stderrOutput = "";
    let lastProgressUpdate = 0;
    child.stderr?.on("data", (data) => {
      const line = data.toString();
      stderrOutput += line;
      if (options.onProgress && totalDuration > 0) {
        const progress = parseFFmpegProgress(line, totalDuration);
        if (progress !== null && Date.now() - lastProgressUpdate > 500) {
          options.onProgress(progress);
          lastProgressUpdate = Date.now();
        }
      }
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        const errorMatch = stderrOutput.match(/Error.*$/m);
        const error = errorMatch ? errorMatch[0] : "FFmpeg conversion failed";
        resolve({
          success: false,
          error,
          stderr: stderrOutput
        });
      }
    });
    child.on("error", (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });
    setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGTERM");
        resolve({
          success: false,
          error: "Conversion timeout (30 minutes maximum)"
        });
      }
    }, 30 * 60 * 1e3);
  });
}
const VIDEO_FORMATS = ["mp4", "mkv", "avi", "mov", "webm", "3gp", "flv", "wmv", "gif"];
function isVideoFormat(ext) {
  const lower = ext.toLowerCase();
  return VIDEO_FORMATS.includes(lower);
}
async function resolveOutputPath$2(outputDir, baseName, targetFormat, overwriteBehavior) {
  const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`);
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
      newPath = path.join(outputDir, `${baseName} (${counter}).${targetFormat}`);
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
function getBaseName$2(filePath) {
  const name = path.basename(filePath);
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1) return name;
  return name.substring(0, lastDot);
}
async function convertVideo(options) {
  const startTime = Date.now();
  const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior, onProgress } = options;
  try {
    await fs.access(sourcePath);
    const mediaInfo = await probeMediaFile(sourcePath);
    if (!mediaInfo) {
      return {
        success: false,
        outputPath: "",
        error: "Failed to probe video file. The file may be corrupted or in an unsupported format.",
        durationMs: Date.now() - startTime
      };
    }
    if (!mediaInfo.videoCodec && targetFormat !== "gif") {
      return {
        success: false,
        outputPath: "",
        error: "Source file does not contain a video stream.",
        durationMs: Date.now() - startTime
      };
    }
    await fs.mkdir(outputDir, { recursive: true });
    const baseName = getBaseName$2(sourcePath);
    const { path: outputPath, skip } = await resolveOutputPath$2(
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
    const result = await executeFFmpeg({
      inputPath: sourcePath,
      outputPath,
      format: targetFormat,
      quality,
      onProgress
    });
    if (!result.success) {
      return {
        success: false,
        outputPath: "",
        error: result.error || "FFmpeg conversion failed",
        durationMs: Date.now() - startTime
      };
    }
    return {
      success: true,
      outputPath,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[video-converter] Failed to convert ${sourcePath}:`, errorMessage);
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
    const { getFFmpegPath: getFFmpegPath2 } = await Promise.resolve().then(() => binaryChecker);
    const { spawn: spawn2 } = await import("child_process");
    const os = await import("os");
    const tmpPath = path.join(os.tmpdir(), `thumb-${Date.now()}.png`);
    const ffmpegPath = await getFFmpegPath2();
    if (!ffmpegPath) {
      console.error("[video-converter] FFmpeg not available for thumbnail generation");
      return null;
    }
    const mediaInfo = await probeMediaFile(filePath);
    const seekTime = mediaInfo ? Math.min(1, mediaInfo.duration * 0.1) : 1;
    const args = [
      "-ss",
      seekTime.toString(),
      "-i",
      filePath,
      "-vframes",
      "1",
      "-vf",
      `scale=${size}:${size}:force_original_aspect_ratio=decrease`,
      "-y",
      tmpPath
    ];
    await new Promise((resolve, reject) => {
      const child = spawn2(ffmpegPath, args);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
      child.on("error", reject);
    });
    const buffer = await fs.readFile(tmpPath);
    await fs.unlink(tmpPath).catch(() => {
    });
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error(`[video-converter] Failed to generate thumbnail for ${filePath}:`, err);
    return null;
  }
}
const AUDIO_FORMATS = ["mp3", "wav", "aac", "ogg", "flac", "wma", "m4a"];
function isAudioFormat(ext) {
  const lower = ext.toLowerCase();
  return AUDIO_FORMATS.includes(lower);
}
async function resolveOutputPath$1(outputDir, baseName, targetFormat, overwriteBehavior) {
  const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`);
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
      newPath = path.join(outputDir, `${baseName} (${counter}).${targetFormat}`);
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
function getBaseName$1(filePath) {
  const name = path.basename(filePath);
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1) return name;
  return name.substring(0, lastDot);
}
async function convertAudio(options) {
  const startTime = Date.now();
  const { sourcePath, outputDir, targetFormat, quality, overwriteBehavior, onProgress } = options;
  try {
    await fs.access(sourcePath);
    const mediaInfo = await probeMediaFile(sourcePath);
    if (!mediaInfo) {
      return {
        success: false,
        outputPath: "",
        error: "Failed to probe audio file. The file may be corrupted or in an unsupported format.",
        durationMs: Date.now() - startTime
      };
    }
    if (!mediaInfo.audioCodec) {
      return {
        success: false,
        outputPath: "",
        error: "Source file does not contain an audio stream.",
        durationMs: Date.now() - startTime
      };
    }
    await fs.mkdir(outputDir, { recursive: true });
    const baseName = getBaseName$1(sourcePath);
    const { path: outputPath, skip } = await resolveOutputPath$1(
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
    const result = await executeFFmpeg({
      inputPath: sourcePath,
      outputPath,
      format: targetFormat,
      quality,
      onProgress
    });
    if (!result.success) {
      return {
        success: false,
        outputPath: "",
        error: result.error || "FFmpeg conversion failed",
        durationMs: Date.now() - startTime
      };
    }
    return {
      success: true,
      outputPath,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[audio-converter] Failed to convert ${sourcePath}:`, errorMessage);
    return {
      success: false,
      outputPath: "",
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}
function buildPandocArgs(options) {
  const { inputPath, outputPath, targetFormat } = options;
  const args = [inputPath, "-o", outputPath];
  const format = targetFormat.toLowerCase();
  if (format === "pdf") {
    args.push("--pdf-engine=xelatex");
    args.push("-V", "geometry:margin=1in");
  } else if (format === "txt" || format === "plain") {
    args.push("-t", "plain");
    args.push("--wrap=auto");
  } else if (format === "docx") {
    args.push("--standalone");
  } else if (format === "epub") {
    args.push("--epub-cover-image=/dev/null");
    args.push("--standalone");
  }
  return args;
}
async function executePandoc(options) {
  const pandocPath = await getPandocPath();
  if (!pandocPath) {
    return {
      success: false,
      error: "Pandoc not available. Please install Pandoc first."
    };
  }
  const args = buildPandocArgs(options);
  console.log("[pandoc-wrapper] Executing:", pandocPath, args.join(" "));
  return new Promise((resolve) => {
    const child = spawn(pandocPath, args);
    let stdoutOutput = "";
    let stderrOutput = "";
    child.stdout.on("data", (data) => {
      stdoutOutput += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderrOutput += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        const error = stderrOutput.trim() || "Pandoc conversion failed";
        resolve({
          success: false,
          error,
          stderr: stderrOutput
        });
      }
    });
    child.on("error", (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });
    setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGTERM");
        resolve({
          success: false,
          error: "Conversion timeout (5 minutes maximum)"
        });
      }
    }, 5 * 60 * 1e3);
  });
}
function canPandocConvert(sourceExt, targetExt) {
  const pandocFormats = /* @__PURE__ */ new Set([
    "md",
    "markdown",
    "rst",
    "txt",
    "html",
    "htm",
    "pdf",
    "docx",
    "odt",
    "epub",
    "rtf",
    "tex",
    "latex",
    "plain"
  ]);
  if (sourceExt.toLowerCase() === "pdf") {
    return false;
  }
  return pandocFormats.has(sourceExt.toLowerCase()) && pandocFormats.has(targetExt.toLowerCase());
}
const DOCUMENT_FORMATS = ["pdf", "epub", "docx", "txt", "rtf", "odt", "md", "html"];
function isDocumentFormat(ext) {
  const lower = ext.toLowerCase();
  return DOCUMENT_FORMATS.includes(lower);
}
async function resolveOutputPath(outputDir, baseName, targetFormat, overwriteBehavior) {
  const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`);
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
      newPath = path.join(outputDir, `${baseName} (${counter}).${targetFormat}`);
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
function getExtension(filePath) {
  const ext = path.extname(filePath);
  return ext ? ext.substring(1).toLowerCase() : "";
}
async function convertDocument(options) {
  const startTime = Date.now();
  const { sourcePath, outputDir, targetFormat, overwriteBehavior } = options;
  try {
    await fs.access(sourcePath);
    const sourceExt = getExtension(sourcePath);
    if (!sourceExt) {
      return {
        success: false,
        outputPath: "",
        error: "Could not determine source file format.",
        durationMs: Date.now() - startTime
      };
    }
    if (!canPandocConvert(sourceExt, targetFormat)) {
      if (sourceExt === "pdf") {
        return {
          success: false,
          outputPath: "",
          error: "PDF as input is not supported by Pandoc. To convert from PDF, you would need additional tools like pdftotext.",
          durationMs: Date.now() - startTime
        };
      }
      return {
        success: false,
        outputPath: "",
        error: `Pandoc does not support conversion from ${sourceExt} to ${targetFormat}.`,
        durationMs: Date.now() - startTime
      };
    }
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
    const result = await executePandoc({
      inputPath: sourcePath,
      outputPath,
      targetFormat
    });
    if (!result.success) {
      return {
        success: false,
        outputPath: "",
        error: result.error || "Pandoc conversion failed",
        durationMs: Date.now() - startTime
      };
    }
    return {
      success: true,
      outputPath,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[document-converter] Failed to convert ${sourcePath}:`, errorMessage);
    return {
      success: false,
      outputPath: "",
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
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
  // DOCUMENT FORMATS (✅ SUPPORTED VIA PANDOC)
  // Note: PDF as input is NOT supported by Pandoc
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
  // VIDEO FORMATS (✅ SUPPORTED VIA FFMPEG)
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
  // AUDIO FORMATS (✅ SUPPORTED VIA FFMPEG)
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
    } else if (category === "video" && isVideoFormat(file.sourceExt)) {
      result = await convertVideo({
        sourcePath: file.sourcePath,
        outputDir: targetDirectory,
        targetFormat: file.targetFormat,
        quality,
        overwriteBehavior,
        onProgress: (percent) => {
          mainWindow?.webContents.send("conversion-progress", {
            fileId: file.fileId,
            progress: percent,
            status: "converting"
          });
        }
      });
    } else if (category === "audio" && isAudioFormat(file.sourceExt)) {
      result = await convertAudio({
        sourcePath: file.sourcePath,
        outputDir: targetDirectory,
        targetFormat: file.targetFormat,
        quality,
        overwriteBehavior,
        onProgress: (percent) => {
          mainWindow?.webContents.send("conversion-progress", {
            fileId: file.fileId,
            progress: percent,
            status: "converting"
          });
        }
      });
    } else if (category === "document" && isDocumentFormat(file.sourceExt)) {
      mainWindow?.webContents.send("conversion-progress", {
        fileId: file.fileId,
        progress: 50,
        status: "converting"
      });
      result = await convertDocument({
        sourcePath: file.sourcePath,
        outputDir: targetDirectory,
        targetFormat: file.targetFormat,
        overwriteBehavior
      });
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
    if (isImageFormat(ext)) {
      return await generateThumbnail$1(filePath, 128);
    }
    if (isVideoFormat(ext)) {
      return await generateThumbnail(filePath, 128);
    }
    return null;
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
ipcMain.handle("get-analytics", async () => {
  return getAnalytics();
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
