import { useState, useEffect } from 'react'
import {
  FolderOutput,
  RotateCcw,
  ExternalLink,
  Github,
  Globe,
  Info,
  Monitor,
  Moon,
  Sun,
  Sliders,
  HardDrive,
  Palette,
  Zap,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/contexts/SettingsContext'
import {
  QUALITY_LABELS,
  OVERWRITE_LABELS,
  THEME_LABELS,
} from '@/lib/settings'
import type { QualityPreset, OverwriteBehavior, ThemeOption } from '@/lib/settings'

type SettingsSection = 'general' | 'conversion' | 'appearance' | 'about'

const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'conversion', label: 'Conversion', icon: Zap },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
]

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-violet-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [appVersion, setAppVersion] = useState<string>('')
  const { settings, updateSetting, resetSettings } = useSettings()

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'))
  }, [])

  const handleSelectDefaultDir = async () => {
    try {
      const dir = await window.electronAPI.selectOutputDir()
      if (dir) updateSetting('defaultOutputDir', dir)
    } catch (err) {
      console.error('Failed to select default directory:', err)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm('Reset all settings to defaults?')) return
    await resetSettings()
  }

  const handleOpenExternal = async (url: string) => {
    try {
      await window.electronAPI.openExternal(url)
    } catch (err) {
      console.error('Failed to open URL:', err)
    }
  }

  return (
    <div className="flex h-full">
      {/* Section Navigation */}
      <div className="flex-shrink-0 w-48 border-r border-zinc-800/50 p-4">
        <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-2">
          Settings
        </h1>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <Separator className="my-4 bg-zinc-800/50" />

        <button
          onClick={handleResetSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-red-400 transition-colors w-full"
        >
          <RotateCcw size={13} />
          Reset to defaults
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 max-w-xl">
        {/* General Section */}
        {activeSection === 'general' && (
          <div>
            <h2 className="text-base font-semibold text-white mb-1">General</h2>
            <p className="text-xs text-zinc-500 mb-5">Configure default behaviors</p>

            <SettingRow
              label="Default output directory"
              description="Where converted files are saved by default"
            >
              <button
                onClick={handleSelectDefaultDir}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-300 transition-all max-w-[200px]"
              >
                <FolderOutput size={13} />
                <span className="truncate">
                  {settings.defaultOutputDir ?? 'Not set'}
                </span>
              </button>
            </SettingRow>

            <Separator className="bg-zinc-800/30" />

            <SettingRow
              label="Auto-open folder"
              description="Open the output folder after conversion completes"
            >
              <ToggleSwitch
                checked={settings.autoOpenFolder}
                onChange={(val) => updateSetting('autoOpenFolder', val)}
              />
            </SettingRow>

            <Separator className="bg-zinc-800/30" />

            <SettingRow
              label="File conflict behavior"
              description="What to do when a file already exists"
            >
              <Select
                value={settings.overwriteBehavior}
                onValueChange={(val) => updateSetting('overwriteBehavior', val as OverwriteBehavior)}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {(Object.entries(OVERWRITE_LABELS) as [OverwriteBehavior, { label: string; description: string }][]).map(
                    ([key, { label }]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        )}

        {/* Conversion Section */}
        {activeSection === 'conversion' && (
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Conversion</h2>
            <p className="text-xs text-zinc-500 mb-5">Quality and performance settings</p>

            <SettingRow
              label="Default quality"
              description="Quality preset for all conversions"
            >
              <Select
                value={settings.conversionQuality}
                onValueChange={(val) => updateSetting('conversionQuality', val as QualityPreset)}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {(Object.entries(QUALITY_LABELS) as [QualityPreset, { label: string; description: string }][]).map(
                    ([key, { label, description }]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label} - {description}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </SettingRow>

            <Separator className="bg-zinc-800/30" />

            <SettingRow
              label="Concurrent conversions"
              description={`Process ${settings.concurrency} files at once`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={settings.concurrency}
                  onChange={(e) => updateSetting('concurrency', parseInt(e.target.value))}
                  className="w-24 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
                <span className="text-xs text-zinc-400 w-4 text-center font-mono">
                  {settings.concurrency}
                </span>
              </div>
            </SettingRow>

            <Separator className="bg-zinc-800/30" />

            <SettingRow
              label="Show advanced options"
              description="Display advanced settings panel on the convert page"
            >
              <ToggleSwitch
                checked={settings.showAdvancedSettings}
                onChange={(val) => updateSetting('showAdvancedSettings', val)}
              />
            </SettingRow>

            <Separator className="bg-zinc-800/30" />

            <div className="mt-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <h3 className="text-xs font-semibold text-zinc-400 mb-2">Conversion Support</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400">Images - Built-in (Sharp)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-xs text-zinc-500">Documents - Requires Pandoc</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-xs text-zinc-500">Video/Audio - Requires FFmpeg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Section */}
        {activeSection === 'appearance' && (
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Appearance</h2>
            <p className="text-xs text-zinc-500 mb-5">Customize the look and feel</p>

            <SettingRow
              label="Theme"
              description="Choose your preferred color scheme"
            >
              <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                {(Object.entries(THEME_LABELS) as [ThemeOption, string][]).map(([key, label]) => {
                  const Icon = key === 'dark' ? Moon : key === 'light' ? Sun : Monitor
                  return (
                    <button
                      key={key}
                      onClick={() => updateSetting('theme', key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        settings.theme === key
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </SettingRow>
          </div>
        )}

        {/* About Section */}
        {activeSection === 'about' && (
          <div>
            <h2 className="text-base font-semibold text-white mb-1">About OpenConvert</h2>
            <p className="text-xs text-zinc-500 mb-5">Your swiss army knife for file conversion</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">OpenConvert</h3>
                    <p className="text-xs text-zinc-500">Version {appVersion || '...'}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  OpenConvert is a free, open-source file conversion tool. Convert images, documents, video, and audio files with ease.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  <HardDrive size={12} className="inline mr-1.5" />
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {['Electron', 'React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Sharp', 'SQLite'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-400 border border-zinc-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleOpenExternal('https://github.com/openconvert/openconvert-desktop')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Github size={16} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">GitHub Repository</p>
                    <p className="text-xs text-zinc-600">View source code and contribute</p>
                  </div>
                  <ExternalLink size={14} className="text-zinc-600" />
                </button>

                <button
                  onClick={() => handleOpenExternal('https://openconvert.github.io/website')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Globe size={16} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Website</p>
                    <p className="text-xs text-zinc-600">Download releases and learn more</p>
                  </div>
                  <ExternalLink size={14} className="text-zinc-600" />
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-zinc-600">
                  Licensed under GNU GPLv3
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
