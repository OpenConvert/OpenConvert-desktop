document.getElementById('select-folder').addEventListener('click',async()=>{
    const folderPath = await window.api.openDirectory();
    document.getElementById('folder-path').innerText = folderPath || "nothing"
})
document.getElementById('toggle-dark-mode').addEventListener('click', async()=>{
    const isDark = await window.darkMode.toggle()
    document.getElementById('theme-source').innerHTML = isDark ? "Dark" : "Light"
  })
  document.getElementById('reset-to-system').addEventListener('click',async ()=>{
    await window.darkMode.system()
    document.getElementById('theme-source').innerHTML = "System"
  })