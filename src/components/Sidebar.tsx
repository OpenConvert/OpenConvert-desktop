import { ArrowLeftRight, Puzzle, Clock, Settings, BarChart3 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type Tab = 'convert' | 'plugins' | 'history' | 'analytics' | 'settings'

interface AppSidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  isSidebarExpanded: boolean
}

const mainNavItems: { id: Tab; label: string; icon: typeof ArrowLeftRight }[] = [
  { id: 'convert', label: 'Convert', icon: ArrowLeftRight },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
]

const settingsNavItems: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AppSidebar({
  activeTab,
  onTabChange,
  isSidebarExpanded,
}: AppSidebarProps) {
  return (
    <div
      data-tour="sidebar"
      className={`flex flex-col justify-between flex-shrink-0 bg-[#0f0f10] border-r border-white/5 transition-all duration-300 overflow-hidden ${isSidebarExpanded ? 'w-64' : 'w-16'
        }`}
    >
      {/* Top section */}
      <div className="flex flex-col">
        {/* Navigation links */}
        <div className="flex flex-col gap-1 px-2 mt-1">
          {mainNavItems.map(({ id, label, icon: Icon }) => (
            <TooltipProvider key={id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTabChange(id)}
                    className={`flex items-center h-9 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${isSidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'
                      } ${activeTab === id
                        ? 'bg-violet-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className={isSidebarExpanded ? 'block' : 'hidden'}>{label}</span>
                  </button>
                </TooltipTrigger>
                {!isSidebarExpanded && (
                  <TooltipContent side="right">
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Bottom section: Settings */}
      <div className="flex flex-col gap-1 px-2 pb-3">
        <div className="h-px bg-white/10 mx-2 mb-1" />
        {settingsNavItems.map(({ id, label, icon: Icon }) => (
          <TooltipProvider key={id} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(id)}
                  className={`flex items-center h-9 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${isSidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'
                    } ${activeTab === id
                      ? 'bg-violet-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className={isSidebarExpanded ? 'block' : 'hidden'}>{label}</span>
                </button>
              </TooltipTrigger>
              {!isSidebarExpanded && (
                <TooltipContent side="right">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  )
}
