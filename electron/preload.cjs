const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window controls ──────────────────────────────────
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('window:alwaysOnTop', flag),

  // ── Timer state sync → main process ──────────────────
  updateTimerState: (state) => ipcRenderer.invoke('timer:state', state),

  // ── Desktop notification ─────────────────────────────
  sendNotification: (title, body) => ipcRenderer.invoke('notification:send', { title, body }),

  // ── Tray menu → renderer events ──────────────────────
  onTimerStart: (cb) => ipcRenderer.on('timer:start', cb),
  onTimerPause: (cb) => ipcRenderer.on('timer:pause', cb),
  onTimerReset: (cb) => ipcRenderer.on('timer:reset', cb),
  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch),
});
