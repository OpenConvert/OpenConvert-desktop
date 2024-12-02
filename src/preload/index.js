import { contextBridge,ipcMain,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, func) => ipcRenderer.on(channel, func),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args)
  }
})
window.addEventListener("DOMContentLoaded",()=>{
  const maximizeButton = document.getElementById('max-button')
  const restoreButton = document.getElementById('restore-button')
 function changeMaxBtn(isMaximizedApp){
  if(isMaximizedApp){
    maximizeButton.classList.add('hidden')
    restoreButton.classList.remove('hidden')
  }else{
    maximizeButton.classList.remove('hidden')
    restoreButton.classList.add('hidden')
  }
 }
 ipcRenderer.on('isMaximized',()=>{changeMaxBtn(true)})
 ipcRenderer.on('isRestored',()=>{changeMaxBtn(false)})

  document.getElementById('min-button').addEventListener('click',()=>{
    ipcRenderer.send('minimize')
  })
  document.getElementById("close-button").addEventListener('click',()=>{
    ipcRenderer.send('close')
  })
  document.getElementById("max-button").addEventListener('click',()=>{
    ipcRenderer.send('maximize')
    console.log('clicked on max button')
  })
  document.getElementById("restore-button").addEventListener('click',()=>{
    ipcRenderer.send('restore')
    console.log('clicked on restore button')
  })
})
