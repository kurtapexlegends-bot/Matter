const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const { fork } = require('child_process');

const fs = require('fs');

let mainWindow = null;
let tray = null;
let serverProcess = null;
const SERVER_PORT = process.env.PORT || 3001;
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

// Check if server is already responding
function checkServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(400, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start backend server in-process (or fallback fork)
async function ensureServerRunning() {
  const isRunning = await checkServerReady(SERVER_PORT);
  if (isRunning) {
    console.log(`[Matter Desktop] Backend daemon already running on port ${SERVER_PORT}.`);
    return;
  }

  // 1. In-Process Bootstrap: Instant start with 50% lower RAM!
  const candidateCompiledPaths = [
    path.join(__dirname, '../server/dist/server.js'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked/server/dist/server.js'),
    path.join(process.cwd(), 'server/dist/server.js'),
  ];

  const existingCompiled = candidateCompiledPaths.find((p) => p && fs.existsSync(p));
  if (existingCompiled) {
    try {
      console.log(`[Matter Desktop] Booting in-process backend server from: ${existingCompiled}`);
      require(existingCompiled);

      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if (await checkServerReady(SERVER_PORT)) {
          console.log(`[Matter Desktop] In-process backend server verified ready on port ${SERVER_PORT}.`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Matter Desktop] In-process server bootstrap warning, falling back to process fork:', err);
    }
  }

  // 2. Fork Process Fallback
  const serverPath = isDev
    ? path.join(__dirname, '../server/src/server.ts')
    : (existingCompiled || path.join(__dirname, '../server/dist/server.js'));

  console.log(`[Matter Desktop] Forking backend daemon from: ${serverPath}`);

  try {
    const forkEnv = {
      ...process.env,
      PORT: String(SERVER_PORT),
      ELECTRON_RUN_AS_NODE: '1',
    };

    if (isDev) {
      serverProcess = fork(path.join(__dirname, '../server/node_modules/tsx/dist/cli.mjs'), [serverPath], {
        env: forkEnv,
        stdio: 'inherit',
      });
    } else {
      serverProcess = fork(serverPath, [], {
        env: forkEnv,
        stdio: 'inherit',
      });
    }

    serverProcess.on('error', (err) => {
      console.error('[Matter Desktop] Backend server process error:', err);
    });

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const ready = await checkServerReady(SERVER_PORT);
      if (ready) {
        console.log(`[Matter Desktop] Forked backend daemon ready on port ${SERVER_PORT}.`);
        return;
      }
    }
  } catch (err) {
    console.error('[Matter Desktop] Failed to fork backend server:', err);
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#07090e',
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  // Smooth appearance when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Track maximized state changes for custom titlebar
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-change', false);
  });

  // Load URL
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      const indexPath = path.join(__dirname, '../client/dist/index.html');
      mainWindow.loadFile(indexPath);
    });
  } else {
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Window Controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// App lifecycle
app.whenReady().then(async () => {
  await ensureServerRunning();
  createWindow();

  // Create system tray
  try {
    const iconPath = path.join(__dirname, 'assets/icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Matter',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Matter',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.setToolTip('Matter — Multi-Terminal Agent Platform');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.focus();
        } else {
          mainWindow.show();
        }
      }
    });
  } catch (err) {
    console.warn('[Matter Desktop] System tray initialization warning:', err.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
});
