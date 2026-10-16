const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aliant', {
  version: () => ipcRenderer.invoke('app:version'),
  config: () => ipcRenderer.invoke('launcher:config'),
  gamePath: () => ipcRenderer.invoke('launcher:game-path'),
  chooseGamePath: () => ipcRenderer.invoke('launcher:set-game-path'),
  launch: (exe, args) => ipcRenderer.invoke('launcher:launch', exe, args),
  updateGame: () => ipcRenderer.invoke('launcher:update-game'),
  checkUpdate: () => ipcRenderer.invoke('app:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('app:download-update'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  openUrl: url => ipcRenderer.invoke('app:open-url', url),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  maximize: () => ipcRenderer.send('window:maximize'),
  on: (channel, callback) => {
    const allowed = ['app:update-available','app:update-none','app:update-progress','app:update-ready','app:update-error'];
    if (allowed.includes(channel)) ipcRenderer.on(channel, (_event, data) => callback(data));
  }
});