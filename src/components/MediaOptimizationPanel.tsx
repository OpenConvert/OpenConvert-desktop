import { useState } from 'react'
import { Film, Music, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface MediaOptimizationPanelProps {
    mediaOptions?: MediaOptimizationOptions
    onOptionsChange: (options: MediaOptimizationOptions | undefined) => void
    type: 'video' | 'audio'
}

export default function MediaOptimizationPanel({ mediaOptions, onOptionsChange, type }: MediaOptimizationPanelProps) {
    const [enabled, setEnabled] = useState(!!mediaOptions)

    const handleToggle = (checked: boolean) => {
        setEnabled(checked)
        if (!checked) {
            onOptionsChange(undefined)
        } else {
            onOptionsChange({})
        }
    }

    const updateOptions = (updates: Partial<MediaOptimizationOptions>) => {
        onOptionsChange({ ...mediaOptions, ...updates })
    }

    if (!enabled) {
        return (
            <div className="flex items-center space-x-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <Checkbox
                    id="enable-media-opts"
                    checked={false}
                    onCheckedChange={handleToggle}
                />
                <label
                    htmlFor="enable-media-opts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                    {type === 'video' ? <Film size={14} className="text-amber-400" /> : <Music size={14} className="text-pink-400" />}
                    <span>Enable {type === 'video' ? 'Video' : 'Audio'} Optimizations</span>
                </label>
            </div>
        )
    }

    return (
        <div className={`space-y-3 p-4 bg-zinc-900/30 rounded-lg border ${type === 'video' ? 'border-amber-500/20' : 'border-pink-500/20'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="enable-media-opts"
                        checked={true}
                        onCheckedChange={handleToggle}
                    />
                    <label
                        htmlFor="enable-media-opts"
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                    >
                        {type === 'video' ? <Film size={14} className="text-amber-400" /> : <Music size={14} className="text-pink-400" />}
                        <span>{type === 'video' ? 'Video' : 'Audio'} Optimizations</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Audio Bitrate */}
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Audio Bitrate</Label>
                    <Select
                        value={mediaOptions?.audioBitrate || 'default'}
                        onValueChange={(val) => updateOptions({ audioBitrate: val === 'default' ? undefined : val })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Auto</SelectItem>
                            <SelectItem value="96k">96 kbps</SelectItem>
                            <SelectItem value="128k">128 kbps</SelectItem>
                            <SelectItem value="192k">192 kbps</SelectItem>
                            <SelectItem value="256k">256 kbps</SelectItem>
                            <SelectItem value="320k">320 kbps</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Video Bitrate (for video only) */}
                {type === 'video' && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Video Bitrate</Label>
                            <Select
                                value={mediaOptions?.videoBitrate || 'default'}
                                onValueChange={(val) => updateOptions({ videoBitrate: val === 'default' ? undefined : val })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Auto</SelectItem>
                                    <SelectItem value="500k">500 kbps</SelectItem>
                                    <SelectItem value="1M">1 Mbps</SelectItem>
                                    <SelectItem value="2M">2 Mbps</SelectItem>
                                    <SelectItem value="5M">5 Mbps</SelectItem>
                                    <SelectItem value="10M">10 Mbps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Resolution</Label>
                            <Select
                                value={mediaOptions?.resolution || 'default'}
                                onValueChange={(val) => updateOptions({ resolution: val === 'default' ? undefined : val })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Original</SelectItem>
                                    <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                                    <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                                    <SelectItem value="1280x720">720p (1280x720)</SelectItem>
                                    <SelectItem value="854x480">480p (854x480)</SelectItem>
                                    <SelectItem value="640x360">360p (640x360)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400">Frame Rate</Label>
                            <Select
                                value={mediaOptions?.fps?.toString() || 'default'}
                                onValueChange={(val) => updateOptions({ fps: val === 'default' ? undefined : parseInt(val) })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Original</SelectItem>
                                    <SelectItem value="24">24 fps</SelectItem>
                                    <SelectItem value="30">30 fps</SelectItem>
                                    <SelectItem value="60">60 fps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>

            <div className="text-xs text-zinc-600 flex items-start gap-1 mt-2 p-2 bg-zinc-800/30 rounded">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                <span>Custom settings will override quality presets. Leave as "Auto" or "Original" to use defaults.</span>
            </div>
        </div>
    )
}
