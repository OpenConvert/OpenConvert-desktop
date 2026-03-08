import { useState, useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/contexts/SettingsContext'
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

      // Keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case ',':
            e.preventDefault()
            setActiveTab('settings')
            break
          case 'h':
            if (e.shiftKey) {
              e.preventDefault()
              setActiveTab('history')
            }
            break
        }
      }
    }

    // Prevent Electron from navigating when a file is dropped outside
    // ConvertView. We attach these in the CAPTURE phase so they run before
    // React's delegated handlers — their only job is e.preventDefault()
    // (which tells the browser not to open the file). We must NOT call
    // e.stopPropagation() here, otherwise the React onDrop/onDragOver
    // handlers will never fire.
    const preventNav = (e: DragEvent) => {
      console.log('[App] Global preventNav fired on', e.type)
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('dragover', preventNav)
    document.addEventListener('drop', preventNav)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('dragover', preventNav)
      document.removeEventListener('drop', preventNav)
    }
  }, [])

  return (
    <SettingsProvider>
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
    </SettingsProvider>
  )
}

export default App
