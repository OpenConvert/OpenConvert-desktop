const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory')
});
contextBridge.exposeInMainWorld('darkMode',{
    toggle: ()=> ipcRenderer.invoke('dark-mode-toggle'),
    system:()=> ipcRenderer.invoke('dark-mode-system')
})