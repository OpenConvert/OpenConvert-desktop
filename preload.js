const os = require('node:os');
const path = require('node:path')
const {contextBridge,ipcRenderer,webUtils} = require('electron');
const { getSumOfData } = require('./db')
contextBridge.exposeInMainWorld('os',{
    homedir:()=>os.homedir()
})
contextBridge.exposeInMainWorld('path',{
    join:(...args)=> path.join(...args)
})
contextBridge.exposeInMainWorld('ipcRenderer',{
    send:(OriginPath,filename,filesize,fileExtension)=> ipcRenderer.send('convert-image',OriginPath,filename,filesize,fileExtension)
})
contextBridge.exposeInMainWorld('convertvideo',{
    video:(OriginPath,filename,filesize,fileExtension)=>ipcRenderer.send('convert-video',OriginPath,filename,filesize,fileExtension)
})
contextBridge.exposeInMainWorld('convertaudio',{
    audio:(OriginPath,filename,filesize,fileExtension)=>ipcRenderer.send('convert-audio',OriginPath,filename,filesize,fileExtension)
})
contextBridge.exposeInMainWorld('webutils',{
    showFilePath:(file)=>{
        const filePath = webUtils.getPathForFile(file)
        return filePath;
    }
})
// settings menu\\
contextBridge.exposeInMainWorld('settings',{
    settings:()=>ipcRenderer.send('open-settings')
})

//custom title bar
window.addEventListener('DOMContentLoaded',()=>{
    const minizimeBtn = document.getElementById('min-button')
    const maxBtn = document.getElementById('max-button')
    const closeBtn = document.getElementById('close-button')
    const restoreBtn = document.getElementById('restore-button')
    minizimeBtn.addEventListener('click',()=>{
        ipcRenderer.send('minimize-window')
    })
    maxBtn.addEventListener('click',()=>{
        ipcRenderer.send('max-window')
    })
    closeBtn.addEventListener('click',()=>{
        ipcRenderer.send('close-window')
    }) 
})
contextBridge.exposeInMainWorld('darkMode',{
    toggle: ()=> ipcRenderer.invoke('dark-mode-toggle'),
    system:()=> ipcRenderer.invoke('dark-mode-system')
})
//write total size of converted files to footer\\
window.addEventListener("DOMContentLoaded",()=>{
    getSumOfData((err,res)=>{
    err ? console.log(err) : document.querySelector('.converted-total').innerHTML=`You are already converted ${res.count}files total size of ${(res.total/(1024*1024)).toFixed(2)}mb`
})
})