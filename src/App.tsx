import { useState, useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import Titlebar from '@/components/Titlebar'
import AppSidebar from '@/components/Sidebar'
import type { Tab } from '@/components/Sidebar'
import ConvertView from '@/views/ConvertView'
import PluginsView from '@/views/PluginsView'
import HistoryView from '@/views/HistoryView'
import SettingsView from '@/views/SettingsView'
import type { ConvertFile } from '@/components/FileList'

function renderView(
  activeTab: Tab,
  files: ConvertFile[],
  setFiles: React.Dispatch<React.SetStateAction<ConvertFile[]>>,
  outputDir: string | null,
  setOutputDir: React.Dispatch<React.SetStateAction<string | null>>
) {
  switch (activeTab) {
    case 'convert':
      return (
        <ConvertView
          files={files}
          setFiles={setFiles}
          outputDir={outputDir}
          setOutputDir={setOutputDir}
        />
      )
    case 'plugins':
      return <PluginsView />
    case 'history':
      return <HistoryView />
    case 'settings':
      return <SettingsView />
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('convert')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  // Lifted state from ConvertView
  const [files, setFiles] = useState<ConvertFile[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)

  // Global handlers
  useEffect(() => {
    // F12 / Ctrl+Shift+I to toggle DevTools (dev mode only)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
        window.electronAPI.toggleDevTools()
      }
    }

    // Prevent Electron from navigating when a file is dropped outside ConvertView
    const preventDragDrop = (e: DragEvent) => e.preventDefault()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('dragover', preventDragDrop)
    window.addEventListener('drop', preventDragDrop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('dragover', preventDragDrop)
      window.removeEventListener('drop', preventDragDrop)
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-[#0a0a0b] text-white overflow-hidden font-sans">
        <Titlebar
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        <div className="flex-1 flex overflow-hidden">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isSidebarExpanded={isSidebarExpanded}
          />

          <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            {renderView(activeTab, files, setFiles, outputDir, setOutputDir)}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
