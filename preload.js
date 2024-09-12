// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveInfo: (info) => ipcRenderer.send('save-info', info),
    loadInfo: () => ipcRenderer.invoke('load-info')
});
