const path = require('node:path')
const os = require('node:os');
const fs = require('node:fs');
const {app, BrowserWindow,ipcMain,screen,dialog, nativeTheme,shell} = require('electron');
const {exec} = require('child_process');
const { writeData } = require('./db')
let custom = "Converted-Files"
let pwd = app.getAppPath('directory')
//datatime\\
const now = new Date();
const date = now.toLocaleDateString(); 
const time = now.toLocaleTimeString(); 
//\\
if(!fs.existsSync(path.join(__dirname,`${custom}`))){fs.mkdirSync(path.join(__dirname,`${custom}`))}
let mainWindow,settingWindow;
function createMainWindow(){
    const primaryDisplay = screen.getPrimaryDisplay()
    const {width,height} = primaryDisplay.workAreaSize
    /* you can open mainWindow in external display\\
     --> External display (exaple size: 1280x1024)
    const displays = screen.getAllDisplays()
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  console.log(externalDisplay)
  */
     mainWindow = new BrowserWindow({
        //icon:'./icons/logo.png',
        minWidth:width/1.5,
        minHeight:height/1.5,
        maxWidth:width,
        maxHeight:height,
        frame:false,
        backgroundColor:'#FFF',
        webPreferences:{
            contextIsolation: true,
            nodeIntegration:true,
            preload:path.join(__dirname,'../preload/preload.js')
        }
    })
    mainWindow.loadURL("http://localhost:3001")
    mainWindow.on('closed',()=>{mainWindow==null;})
    mainWindow.webContents.openDevTools(); //--> open dev tools if you want
}
app.whenReady().then(()=>{
    createMainWindow()
})