const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const zlib = require('zlib');

// ── State ──────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let isQuitting = false;

// Current timer state (updated from renderer)
let currentStatus = { secondsLeft: 0, mode: 'focus', status: 'idle' };

// ── CRC32 (for PNG chunk validation) ───────────────────
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk builder ──────────────────────────────────
function pngChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB = Buffer.alloc(4);
  lenB.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeB, data]);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// ── Generate tray icon programmatically ────────────────
// Creates a circular icon (ring or filled) at the given size.
// No external files, no canvas — pure Node.js + zlib.
function generateTrayIcon(size, colorHex, filled) {
  // Parse hex colour → RGBA
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  const center = (size - 1) / 2;
  const outerR = size / 2 - 0.5;       // outer edge of ring
  const thickness = Math.max(1.5, size / 10);
  const innerR = filled ? 0 : outerR - thickness;

  // Build raw filtered scanlines (filter byte 0 = None, then RGBA)
  const rowBytes = 1 + size * 4;
  const raw = Buffer.alloc(size * rowBytes);

  for (let y = 0; y < size; y++) {
    const off = y * rowBytes;
    raw[off] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const p = off + 1 + x * 4;
      if (dist <= outerR && dist >= innerR) {
        raw[p]     = r;
        raw[p + 1] = g;
        raw[p + 2] = b;
        raw[p + 3] = 255;
      }
      // else: stays 0 (fully transparent)
    }
  }

  // Compress with zlib
  const idat = zlib.deflateSync(raw);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Update tray icon & tooltip ─────────────────────────
function updateTray() {
  if (!tray) return;
  const { mode, status, secondsLeft } = currentStatus;

  // Choose colour per mode
  const colors = { focus: '#FF5F57', shortBreak: '#30D158', longBreak: '#64D2FF' };
  const color = colors[mode] || '#FF5F57';
  const filled = status === 'running';

  // Generate @2x for HiDPI
  const buf16 = generateTrayIcon(16, color, filled);
  const buf32 = generateTrayIcon(32, color, filled);

  const img16 = nativeImage.createFromBuffer(buf16);
  const img32 = nativeImage.createFromBuffer(buf32);
  img16.setTemplateImage(true); // macOS: works as a template image
  img32.setTemplateImage(true);

  // Combine into a single nativeImage with @2x
  const combined = nativeImage.createFromBuffer(buf32);
  // For simplicity on cross-platform, use the 32px version;
  // Electron scales it down for the tray automatically.
  tray.setImage(img32);

  // Tooltip
  const modeLabel = mode === 'focus' ? '专注' : mode === 'shortBreak' ? '短休' : '长休';
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const time = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  let tooltip = '番茄钟 · Pomodoro';
  if (status === 'running') {
    tooltip = `${modeLabel}中 ${time}`;
  } else if (status === 'paused') {
    tooltip = '番茄钟 · 已暂停';
  }
  tray.setToolTip(tooltip);
}

// ── Update Windows taskbar progress ────────────────────
function updateTaskbar() {
  if (!mainWindow) return;
  const { mode, status, secondsLeft } = currentStatus;

  // Calculate total & progress
  const totals = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
  const total = totals[mode] || 25 * 60;
  const progress = total > 0 ? (total - secondsLeft) / total : 0;

  if (status === 'idle') {
    mainWindow.setProgressBar(-1); // clear
  } else {
    mainWindow.setProgressBar(progress, {
      mode: mode === 'focus' ? 'error' : mode === 'shortBreak' ? 'normal' : 'normal',
    });
  }
}

// ── Window creation ────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 560,
    minWidth: 340,
    minHeight: 480,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray creation ──────────────────────────────────────
function createTray() {
  const buf = generateTrayIcon(32, '#FF5F57', false);
  const icon = nativeImage.createFromBuffer(buf);
  icon.setTemplateImage(true);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => { mainWindow?.show(); mainWindow?.focus(); },
    },
    { type: 'separator' },
    {
      label: '开始专注',
      click: () => { mainWindow?.webContents.send('timer:start'); },
    },
    {
      label: '暂停',
      click: () => { mainWindow?.webContents.send('timer:pause'); },
    },
    {
      label: '重置',
      click: () => { mainWindow?.webContents.send('timer:reset'); },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setToolTip('番茄钟 · Pomodoro');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// ── App lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();

  const { globalShortcut } = require('electron');
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { isQuitting = true; });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

// ── IPC handlers ───────────────────────────────────────
ipcMain.handle('window:minimize', () => { mainWindow?.minimize(); });
ipcMain.handle('window:close', () => { mainWindow?.hide(); });
ipcMain.handle('window:alwaysOnTop', (_event, flag) => {
  mainWindow?.setAlwaysOnTop(flag);
  return mainWindow?.isAlwaysOnTop();
});

// Timer state update from renderer (every tick)
ipcMain.handle('timer:state', (_event, state) => {
  currentStatus = state;
  updateTray();
  updateTaskbar();
});

// Desktop notification
ipcMain.handle('notification:send', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({ title, body, silent: false });
    notif.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notif.show();
  }
  return true;
});
