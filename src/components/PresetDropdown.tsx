import { useState, useMemo } from 'react'
import { Clock, Video, Music, Smartphone, Share2, Search, ChevronDown, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Preset, PresetTab } from '@/lib/presets'
import { BUILTIN_PRESETS, getPresetsByTab, getSubcategoriesForTab, getPresetsBySubcategory, getSubcategoryDisplayName } from '@/lib/presets'

interface PresetDropdownProps {
  onSelectPreset: (preset: Preset) => void
}

export function PresetDropdown({ onSelectPreset }: PresetDropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PresetTab>('video')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter presets based on current tab, subcategory, and search
  const filteredPresets = useMemo(() => {
    let presets = getPresetsByTab(activeTab, BUILTIN_PRESETS)
    
    // Filter by subcategory if selected
    if (selectedSubcategory) {
      presets = getPresetsBySubcategory(selectedSubcategory, presets)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      presets = presets.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    
    return presets
  }, [activeTab, selectedSubcategory, searchQuery])

  const subcategories = useMemo(() => {
    return getSubcategoriesForTab(activeTab)
  }, [activeTab])

  const handleSelectPreset = (preset: Preset) => {
    onSelectPreset(preset)
    setOpen(false)
  }

  const handleTabChange = (tab: PresetTab) => {
    setActiveTab(tab)
    setSelectedSubcategory(null) // Reset subcategory when changing tabs
    setSearchQuery('') // Reset search
  }

  const tabs: Array<{ id: PresetTab; label: string; icon: typeof Clock }> = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'social', label: 'Social', icon: Share2 },
  ]

  return (
    <div className="flex gap-0">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-300 transition-all"
          >
            <Layers size={14} />
            Presets
            <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-700 p-0 w-[700px]">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-950/50">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${activeTab === tab.id 
                      ? 'bg-violet-600 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex">
            {/* Left Sidebar - Categories */}
            {subcategories.length > 0 && (
              <div className="w-40 border-r border-zinc-800 bg-zinc-950/30">
                <div className="p-2">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`
                      w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors
                      ${selectedSubcategory === null
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    All
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors
                        ${selectedSubcategory === sub
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }
                      `}
                    >
                      {getSubcategoryDisplayName(sub)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right Content - Preset List */}
            <div className="flex-1 flex flex-col">
              {/* Search Bar */}
              <div className="p-3 border-b border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <Input
                    type="text"
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Preset List */}
              <ScrollArea className="h-[300px]">
                <div className="p-2">
                  {filteredPresets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-zinc-500">No presets found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredPresets.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className="w-full flex items-center gap-3 p-2 rounded-md border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group text-left"
                        >
                          {/* Name & Description */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-white group-hover:text-violet-300 transition-colors truncate">
                              {preset.name}
                            </h4>
                            {preset.description && (
                              <p className="text-[10px] text-zinc-500 truncate">{preset.description}</p>
                            )}
                          </div>

                          {/* Settings Display */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[10px] text-zinc-400">
                              {(() => {
                                const s = preset.settings as any
                                const parts: string[] = []
                                if (s.resolution) parts.push(s.resolution)
                                if (s.videoBitrate) parts.push(s.videoBitrate)
                                if (s.audioBitrate && !s.videoBitrate) parts.push(s.audioBitrate)
                                return parts.join(' • ')
                              })()}
                            </p>
                          </div>

                          {/* Target Format */}
                          <div className="flex-shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {preset.settings.targetFormat.toUpperCase()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
