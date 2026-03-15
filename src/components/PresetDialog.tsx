import { useState, useMemo } from 'react'
import { X, Clock, Video, Music, Smartphone, Share2, Search, Settings, Monitor, Youtube, Instagram, Facebook, Tv, Film, Mic, Image as ImageIcon, Tablet, Laptop, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Preset, PresetTab } from '@/lib/presets'
import { BUILTIN_PRESETS, getPresetsByTab, getPresetsBySubcategory, getSubcategoriesForTab, getSubcategoryDisplayName } from '@/lib/presets'

interface PresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPreset: (preset: Preset) => void
  category?: 'video' | 'audio' | 'image' | 'document'
}

export function PresetDialog({ open, onOpenChange, onSelectPreset, category }: PresetDialogProps) {
  const [activeTab, setActiveTab] = useState<PresetTab>('recently')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter presets based on current tab, subcategory, and search
  const filteredPresets = useMemo(() => {
    let presets = getPresetsByTab(activeTab, BUILTIN_PRESETS)
    
    // Filter by category if specified
    if (category) {
      presets = presets.filter(p => p.category === category)
    }
    
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
  }, [activeTab, selectedSubcategory, searchQuery, category])

  const subcategories = useMemo(() => {
    return getSubcategoriesForTab(activeTab)
  }, [activeTab])

  const handleSelectPreset = (preset: Preset) => {
    onSelectPreset(preset)
    onOpenChange(false)
  }

  const handleTabChange = (tab: PresetTab) => {
    setActiveTab(tab)
    setSelectedSubcategory(null) // Reset subcategory when changing tabs
  }

  if (!open) return null

  const tabs: Array<{ id: PresetTab; label: string; icon: typeof Clock }> = [
    { id: 'recently', label: 'Recently Used', icon: Clock },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'social', label: 'Social Video', icon: Share2 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative z-50 w-full max-w-6xl h-[80vh] bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Conversion Presets</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Choose a preset to quickly configure conversion settings</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-800 bg-zinc-950/50">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id 
                    ? 'bg-violet-600 text-white' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Categories */}
          {subcategories.length > 0 && (
            <div className="w-56 border-r border-zinc-800 bg-zinc-950/30">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
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
                        w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
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
            </div>
          )}

          {/* Right Content - Preset List */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  type="text"
                  placeholder="Search presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Preset Table */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {filteredPresets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-zinc-500">No presets found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPresets.map(preset => (
                      <PresetRow
                        key={preset.id}
                        preset={preset}
                        onSelect={() => handleSelectPreset(preset)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PresetRowProps {
  preset: Preset
  onSelect: () => void
}

function PresetRow({ preset, onSelect }: PresetRowProps) {
  const getIconComponent = (iconName?: string) => {
    const icons: Record<string, any> = {
      Video, Music, Smartphone, Monitor, Youtube, Instagram, Facebook, Tv, Film, Mic, 
      Image: ImageIcon, Tablet, Laptop, Globe
    }
    return icons[iconName || 'Settings'] || Settings
  }

  const Icon = getIconComponent(preset.icon)

  // Format settings display
  const getSettingsDisplay = () => {
    const s = preset.settings as any
    const parts: string[] = []
    
    if (s.resolution) parts.push(s.resolution)
    if (s.videoBitrate) parts.push(s.videoBitrate)
    if (s.audioBitrate && !s.videoBitrate) parts.push(s.audioBitrate)
    if (s.width && s.height) parts.push(`${s.width}x${s.height}`)
    if (s.fps) parts.push(`${s.fps}fps`)
    
    return parts.join(' • ')
  }

  const getCodecsDisplay = () => {
    const s = preset.settings as any
    const parts: string[] = []
    
    if (s.videoCodec) parts.push(s.videoCodec.toUpperCase())
    if (s.audioCodec) parts.push(s.audioCodec.toUpperCase())
    
    return parts.join(' / ')
  }

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-400">
        <Icon size={20} />
      </div>

      {/* Name & Description */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white group-hover:text-violet-300 transition-colors">
            {preset.name}
          </h4>
          {preset.isBuiltIn && (
            <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700 px-1.5 py-0">
              Built-in
            </Badge>
          )}
        </div>
        {preset.description && (
          <p className="text-sm text-zinc-500 mt-0.5">{preset.description}</p>
        )}
      </div>

      {/* Settings Display */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm text-zinc-400">{getSettingsDisplay()}</p>
        {getCodecsDisplay() && (
          <p className="text-xs text-zinc-600 mt-0.5">{getCodecsDisplay()}</p>
        )}
      </div>

      {/* Target Format */}
      <div className="flex-shrink-0">
        <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 px-2.5 py-1">
          {preset.settings.targetFormat.toUpperCase()}
        </Badge>
      </div>
    </button>
  )
}
