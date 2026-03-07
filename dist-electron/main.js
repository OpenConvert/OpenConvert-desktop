import { app as f, BrowserWindow as T, ipcMain as u, dialog as _, shell as R } from "electron";
import d from "path";
import { fileURLToPath as y } from "url";
import v from "fs/promises";
import I from "better-sqlite3";
import O from "sharp";
let g = null;
function m() {
  if (!g)
    throw new Error("Database not initialized. Call initDatabase() first.");
  return g;
}
function D() {
  const e = d.join(f.getPath("userData"), "openconvert.db");
  console.log("[database] Initializing database at:", e), g = new I(e), g.pragma("journal_mode = WAL"), g.exec(`
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
    `), console.log("[database] Database initialized successfully.");
}
function S(e) {
  const o = m().prepare(`
        INSERT INTO conversions (created_at, source_path, source_name, source_ext, source_size, target_format, output_path, status, error_message, duration_ms)
        VALUES (@created_at, @source_path, @source_name, @source_ext, @source_size, @target_format, @output_path, @status, @error_message, @duration_ms)
    `).run(e);
  return { ...e, id: o.lastInsertRowid };
}
function F(e = 50, t = 0) {
  const n = m(), o = n.prepare(`
        SELECT * FROM conversions ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(e, t), i = n.prepare("SELECT COUNT(*) as count FROM conversions").get();
  return { items: o, total: i.count };
}
function x(e, t = 50, n = 0) {
  const o = m(), i = o.prepare(`
        SELECT * FROM conversions WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(e, t, n), r = o.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get(e);
  return { items: i, total: r.count };
}
function N(e, t = 50, n = 0) {
  const o = m(), i = `%${e}%`, r = o.prepare(`
        SELECT * FROM conversions WHERE source_name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(i, t, n), p = o.prepare("SELECT COUNT(*) as count FROM conversions WHERE source_name LIKE ?").get(i);
  return { items: r, total: p.count };
}
function M(e) {
  return m().prepare("DELETE FROM conversions WHERE id = ?").run(e).changes > 0;
}
function A() {
  return m().prepare("DELETE FROM conversions").run().changes;
}
function U() {
  const e = m(), t = e.prepare("SELECT COUNT(*) as count FROM conversions").get().count, n = e.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("completed").count, o = e.prepare("SELECT COUNT(*) as count FROM conversions WHERE status = ?").get("failed").count;
  return { total: t, completed: n, failed: o };
}
function P(e) {
  return m().prepare("SELECT value FROM settings WHERE key = ?").get(e)?.value ?? null;
}
function z(e, t) {
  m().prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(e, t);
}
function j() {
  const t = m().prepare("SELECT key, value FROM settings").all(), n = {};
  for (const o of t)
    n[o.key] = o.value;
  return n;
}
function k() {
  m().prepare("DELETE FROM settings").run();
}
function V() {
  g && (g.close(), g = null, console.log("[database] Database closed."));
}
const W = ["png", "jpg", "jpeg", "webp", "gif", "avif", "tiff", "tif", "jxl"], X = ["svg", "ico", "bmp"];
function L(e) {
  const t = e.toLowerCase();
  return [...W, ...X].includes(t);
}
async function $(e, t, n, o) {
  const i = n === "jpg" ? "jpg" : n, r = d.join(e, `${t}.${i}`);
  try {
    if (await v.access(r), o === "overwrite")
      return { path: r, skip: !1 };
    if (o === "skip")
      return { path: r, skip: !0 };
    let p = 1, l;
    do {
      l = d.join(e, `${t} (${p}).${i}`), p++;
      try {
        await v.access(l);
      } catch {
        return { path: l, skip: !1 };
      }
    } while (p < 1e4);
    return { path: l, skip: !1 };
  } catch {
    return { path: r, skip: !1 };
  }
}
function B(e) {
  const t = d.basename(e), n = t.lastIndexOf(".");
  return n === -1 ? t : t.substring(0, n);
}
async function H(e) {
  const t = Date.now(), { sourcePath: n, outputDir: o, targetFormat: i, quality: r, overwriteBehavior: p } = e;
  try {
    await v.access(n), await v.mkdir(o, { recursive: !0 });
    const l = B(n), { path: c, skip: E } = await $(
      o,
      l,
      i,
      p
    );
    if (E)
      return {
        success: !0,
        outputPath: c,
        durationMs: Date.now() - t
      };
    let s = O(n, {
      animated: !1,
      // Don't process animated frames for conversion
      failOn: "none"
      // Don't fail on minor image issues
    });
    const w = i.toLowerCase();
    switch (w) {
      case "png":
        s = s.png({
          quality: r,
          compressionLevel: r >= 90 ? 6 : r >= 60 ? 7 : 9
        });
        break;
      case "jpg":
      case "jpeg":
        s = s.jpeg({
          quality: r,
          mozjpeg: !0
          // Better compression
        });
        break;
      case "webp":
        s = s.webp({
          quality: r,
          lossless: r >= 100
        });
        break;
      case "avif":
        s = s.avif({
          quality: r,
          lossless: r >= 100
        });
        break;
      case "gif":
        s = s.gif();
        break;
      case "tiff":
      case "tif":
        s = s.tiff({
          quality: r,
          compression: "lzw"
        });
        break;
      case "jxl":
        s = s.jxl({
          quality: r,
          lossless: r >= 100
        });
        break;
      case "bmp":
        s = s.png({ compressionLevel: 0 });
        break;
      case "ico":
        s = s.resize(256, 256, { fit: "inside", withoutEnlargement: !0 }).png();
        break;
      case "pdf":
        return {
          success: !1,
          outputPath: "",
          error: "Image to PDF conversion is not yet supported. A document converter is required.",
          durationMs: Date.now() - t
        };
      default:
        return {
          success: !1,
          outputPath: "",
          error: `Unsupported target format: ${w}`,
          durationMs: Date.now() - t
        };
    }
    return await s.toFile(c), {
      success: !0,
      outputPath: c,
      durationMs: Date.now() - t
    };
  } catch (l) {
    const c = l instanceof Error ? l.message : String(l);
    return console.error(`[image-converter] Failed to convert ${n}:`, c), {
      success: !1,
      outputPath: "",
      error: c,
      durationMs: Date.now() - t
    };
  }
}
async function q(e, t = 128) {
  try {
    return `data:image/png;base64,${(await O(e, {
      failOn: "none"
    }).resize(t, t, {
      fit: "cover",
      position: "centre"
    }).png({ quality: 70, compressionLevel: 9 }).toBuffer()).toString("base64")}`;
  } catch (n) {
    return console.error(`[image-converter] Failed to generate thumbnail for ${e}:`, n), null;
  }
}
const Y = /* @__PURE__ */ new Set([
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
]), G = /* @__PURE__ */ new Set([
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
]), K = /* @__PURE__ */ new Set([
  "mp4",
  "mkv",
  "avi",
  "mov",
  "webm",
  "3gp",
  "flv",
  "wmv"
]), J = /* @__PURE__ */ new Set([
  "mp3",
  "wav",
  "aac",
  "ogg",
  "flac",
  "wma",
  "m4a"
]);
function Q(e) {
  const t = e.toLowerCase();
  return Y.has(t) ? "image" : G.has(t) ? "document" : K.has(t) ? "video" : J.has(t) ? "audio" : null;
}
const h = d.dirname(y(import.meta.url)), b = !!process.env.VITE_DEV_SERVER_URL;
let a = null;
function C() {
  a = new T({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: !1,
    backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: d.join(h, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !1,
      devTools: !0
    }
  }), a.on("maximize", () => {
    a?.webContents.send("window-maximized-changed", !0);
  }), a.on("unmaximize", () => {
    a?.webContents.send("window-maximized-changed", !1);
  }), a.on("closed", () => {
    a = null;
  }), console.log("[main] isDev:", b), console.log("[main] VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL), b ? (a.loadURL(process.env.VITE_DEV_SERVER_URL), console.log("[main] Dev server URL loaded.")) : a.loadFile(d.join(h, "../dist/index.html"));
  let e = null;
  u.removeAllListeners("toggle-dev-tools"), u.on("toggle-dev-tools", () => {
    console.log("[main] toggle-dev-tools IPC received"), a && (a.webContents.isDevToolsOpened() ? (console.log("[main] Closing DevTools"), a.webContents.closeDevTools(), e && !e.isDestroyed() && e.close(), e = null) : (console.log("[main] Opening Custom DevTools Window"), (!e || e.isDestroyed()) && (e = new T({
      width: 800,
      height: 600,
      title: "OpenConvert Developer Tools"
    }), e.on("closed", () => {
      e = null;
    })), a.webContents.setDevToolsWebContents(e.webContents), a.webContents.openDevTools({ mode: "detach" })));
  });
}
f.whenReady().then(() => {
  D(), C();
});
f.on("window-all-closed", () => {
  process.platform !== "darwin" && f.quit();
});
f.on("will-quit", () => {
  V();
});
f.on("activate", () => {
  T.getAllWindows().length === 0 && C();
});
u.on("window-minimize", () => a?.minimize());
u.on("window-maximize", () => {
  a?.isMaximized() ? a.unmaximize() : a?.maximize();
});
u.on("window-close", () => a?.close());
u.handle("open-file-dialog", async () => {
  if (!a) return [];
  const e = await _.showOpenDialog(a, {
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
  return e.canceled ? [] : await Promise.all(
    e.filePaths.map(async (n) => {
      const o = await v.stat(n);
      return {
        path: n,
        name: d.basename(n),
        ext: d.extname(n).slice(1).toLowerCase(),
        size: o.size
      };
    })
  );
});
u.handle("select-output-dir", async () => {
  if (!a) return null;
  const e = await _.showOpenDialog(a, {
    properties: ["openDirectory", "createDirectory"]
  });
  return e.canceled ? null : e.filePaths[0];
});
u.handle("get-file-info", async (e, t) => {
  try {
    const n = await v.stat(t);
    return {
      path: t,
      name: d.basename(t),
      ext: d.extname(t).slice(1).toLowerCase(),
      size: n.size
    };
  } catch {
    return null;
  }
});
async function Z(e, t, n) {
  const o = [], i = /* @__PURE__ */ new Set();
  for (const r of e) {
    const p = (async () => {
      const l = await n(r);
      o.push(l);
    })();
    i.add(p), p.finally(() => i.delete(p)), i.size >= t && await Promise.race(i);
  }
  return await Promise.all(i), o;
}
u.handle("convert-files", async (e, t) => {
  console.log("[main] Received conversion payload:", JSON.stringify(t, null, 2));
  const {
    targetDirectory: n,
    filesToConvert: o,
    quality: i = 90,
    concurrency: r = 3,
    overwriteBehavior: p = "rename"
  } = t, l = [];
  return await Z(o, r, async (c) => {
    const E = Q(c.sourceExt);
    a?.webContents.send("conversion-progress", {
      fileId: c.fileId,
      progress: 10,
      status: "converting"
    });
    let s;
    E === "image" && L(c.sourceExt) ? (a?.webContents.send("conversion-progress", {
      fileId: c.fileId,
      progress: 30,
      status: "converting"
    }), s = await H({
      sourcePath: c.sourcePath,
      outputDir: n,
      targetFormat: c.targetFormat,
      quality: i,
      overwriteBehavior: p
    }), a?.webContents.send("conversion-progress", {
      fileId: c.fileId,
      progress: 90,
      status: "converting"
    })) : E === "document" ? s = {
      success: !1,
      outputPath: "",
      error: "Document conversion requires Pandoc to be installed. Please install Pandoc (https://pandoc.org) and try again.",
      durationMs: 0
    } : E === "video" ? s = {
      success: !1,
      outputPath: "",
      error: "Video conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.",
      durationMs: 0
    } : E === "audio" ? s = {
      success: !1,
      outputPath: "",
      error: "Audio conversion requires FFmpeg to be installed. Please install FFmpeg (https://ffmpeg.org) and try again.",
      durationMs: 0
    } : s = {
      success: !1,
      outputPath: "",
      error: `Unsupported file format: .${c.sourceExt}`,
      durationMs: 0
    };
    try {
      S({
        created_at: Date.now(),
        source_path: c.sourcePath,
        source_name: c.sourceName,
        source_ext: c.sourceExt,
        source_size: c.sourceSize,
        target_format: c.targetFormat,
        output_path: s.outputPath || "",
        status: s.success ? "completed" : "failed",
        error_message: s.error ?? null,
        duration_ms: s.durationMs
      });
    } catch (w) {
      console.error("[main] Failed to save conversion history:", w);
    }
    a?.webContents.send("conversion-progress", {
      fileId: c.fileId,
      progress: 100,
      status: s.success ? "done" : "error",
      error: s.error
    }), l.push({
      fileId: c.fileId,
      success: s.success,
      outputPath: s.outputPath,
      error: s.error
    });
  }), { success: !0, results: l };
});
u.handle("generate-thumbnail", async (e, t) => {
  try {
    const n = d.extname(t).slice(1).toLowerCase();
    return L(n) ? await q(t, 128) : null;
  } catch {
    return null;
  }
});
u.handle("get-history", async (e, t) => {
  const { limit: n = 50, offset: o = 0, status: i, search: r } = t;
  return r && r.trim().length > 0 ? N(r.trim(), n, o) : i && i !== "all" ? x(i, n, o) : F(n, o);
});
u.handle("get-history-stats", async () => U());
u.handle("delete-history-item", async (e, t) => M(t));
u.handle("clear-history", async () => A());
u.handle("show-in-folder", async (e, t) => (R.showItemInFolder(t), !0));
u.handle("get-settings", async () => j());
u.handle("get-setting", async (e, t) => P(t));
u.handle("update-setting", async (e, t, n) => (z(t, n), !0));
u.handle("reset-settings", async () => (k(), !0));
u.handle("get-app-version", async () => f.getVersion());
u.handle("get-app-path", async (e, t) => {
  try {
    return f.getPath(t);
  } catch {
    return null;
  }
});
u.handle("open-external", async (e, t) => (await R.openExternal(t), !0));
