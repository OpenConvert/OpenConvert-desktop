import { useState, useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import Titlebar from '@/components/Titlebar'
import AppSidebar from '@/components/Sidebar'
import type { Tab } from '@/components/Sidebar'
import ConvertView from '@/views/ConvertView'
import PluginsView from '@/views/PluginsView'
import HistoryView from '@/views/HistoryView'
import SettingsView from '@/views/SettingsView'

function renderView(activeTab: Tab) {
  switch (activeTab) {
    case 'convert':
      return <ConvertView />
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

  // F12 / Ctrl+Shift+I to toggle DevTools (dev mode only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
        window.electronAPI.toggleDevTools()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {renderView(activeTab)}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
