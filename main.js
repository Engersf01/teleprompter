const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let stateFile;

function getStateFile() {
  if (!stateFile) {
    stateFile = path.join(app.getPath('userData'), 'window-state.json');
  }
  return stateFile;
}

function loadWindowState() {
  try {
    const f = getStateFile();
    if (fs.existsSync(f)) {
      return JSON.parse(fs.readFileSync(f, 'utf-8'));
    }
  } catch (e) {
    // ignore corrupt state
  }
  return null;
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const state = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  };
  try {
    fs.writeFileSync(getStateFile(), JSON.stringify(state));
  } catch (e) {
    // ignore write errors
  }
}

function createWindow() {
  const saved = loadWindowState();
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  const winWidth = saved?.width || 800;
  const winHeight = saved?.height || 600;
  const winX = saved?.x ?? Math.round((screenW - winWidth) / 2);
  const winY = saved?.y ?? Math.round((screenH - winHeight) / 2);

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    resizable: true,
    minimizable: true,
    maximizable: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Transparent windows on macOS need this
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Save window state periodically and on close
  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resized', saveWindowState);
  mainWindow.on('close', saveWindowState);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('set-always-on-top', (event, value) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(value);
});

ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (!mainWindow) return;
  if (ignore) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
});

ipcMain.handle('get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
