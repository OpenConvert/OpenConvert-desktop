import { app as l, BrowserWindow as a, ipcMain as n, dialog as d } from "electron";
import t from "path";
import { fileURLToPath as w } from "url";
import c from "fs/promises";
const r = t.dirname(w(import.meta.url)), m = !!process.env.VITE_DEV_SERVER_URL;
let e = null;
function p() {
  e = new a({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: !1,
    backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: t.join(r, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !1,
      devTools: !0
    }
  }), e.on("maximize", () => {
    e?.webContents.send("window-maximized-changed", !0);
  }), e.on("unmaximize", () => {
    e?.webContents.send("window-maximized-changed", !1);
  }), e.on("closed", () => {
    e = null;
  }), console.log("[main] isDev:", m), console.log("[main] VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL), m ? (e.loadURL(process.env.VITE_DEV_SERVER_URL), console.log("[main] Dev server URL loaded.")) : e.loadFile(t.join(r, "../dist/index.html"));
  let o = null;
  n.removeAllListeners("toggle-dev-tools"), n.on("toggle-dev-tools", () => {
    console.log("[main] toggle-dev-tools IPC received"), e && (e.webContents.isDevToolsOpened() ? (console.log("[main] Closing DevTools"), e.webContents.closeDevTools(), o && !o.isDestroyed() && o.close(), o = null) : (console.log("[main] Opening Custom DevTools Window"), (!o || o.isDestroyed()) && (o = new a({
      width: 800,
      height: 600,
      title: "OpenConvert Developer Tools"
    }), o.on("closed", () => {
      o = null;
    })), e.webContents.setDevToolsWebContents(o.webContents), e.webContents.openDevTools({ mode: "detach" })));
  });
}
l.whenReady().then(p);
l.on("window-all-closed", () => {
  process.platform !== "darwin" && l.quit();
});
l.on("activate", () => {
  a.getAllWindows().length === 0 && p();
});
n.on("window-minimize", () => e?.minimize());
n.on("window-maximize", () => {
  e?.isMaximized() ? e.unmaximize() : e?.maximize();
});
n.on("window-close", () => e?.close());
n.handle("open-file-dialog", async () => {
  if (!e) return [];
  const o = await d.showOpenDialog(e, {
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
  return o.canceled ? [] : await Promise.all(
    o.filePaths.map(async (s) => {
      const f = await c.stat(s);
      return {
        path: s,
        name: t.basename(s),
        ext: t.extname(s).slice(1).toLowerCase(),
        size: f.size
      };
    })
  );
});
n.handle("select-output-dir", async () => {
  if (!e) return null;
  const o = await d.showOpenDialog(e, {
    properties: ["openDirectory", "createDirectory"]
  });
  return o.canceled ? null : o.filePaths[0];
});
n.handle("get-file-info", async (o, i) => {
  try {
    const s = await c.stat(i);
    return {
      path: i,
      name: t.basename(i),
      ext: t.extname(i).slice(1).toLowerCase(),
      size: s.size
    };
  } catch {
    return null;
  }
});
n.handle("convert-files", async (o, i) => (console.log("[main] Received conversion payload:", JSON.stringify(i, null, 2)), { success: !0 }));
