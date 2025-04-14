import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:3344";

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
const isDevelopment = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

async function createWindow() {
  win = new BrowserWindow({
    title: "Archery Contest",
    icon: path.join(process.env.VITE_PUBLIC, "logo.svg"),
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDevelopment, // Désactiver webSecurity seulement en développement
    },
  });

  // En mode développement, connectez-vous au serveur Vite
  if (isDevelopment) {
    console.log(`Loading from dev server: ${VITE_DEV_SERVER_URL}`);
    win.loadURL(VITE_DEV_SERVER_URL);
    
    // Ouvrir les DevTools quand on est en mode développement
    win.webContents.openDevTools();
  } else {
    // En production, chargez le fichier HTML
    try {
      console.log(`Loading from ${indexHtml}`);
      await win.loadFile(indexHtml);
    } catch (error) {
      console.error('Error loading HTML file:', error);
      // Tentative de secours
      try {
        const appPath = app.getAppPath();
        const alternativePath = path.join(appPath, 'dist', 'index.html');
        console.log(`Trying alternative path: ${alternativePath}`);
        await win.loadFile(alternativePath);
      } catch (err) {
        console.error('Error with alternative path:', err);
      }
    }
  }

  // Make all links with target="_blank" open with default browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Event listeners
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDevelopment) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
