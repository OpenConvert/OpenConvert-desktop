import { useState } from 'react'
import { Image, RotateCw, Maximize2, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface ImageOptimizationPanelProps {
    imageOptions?: ImageOptimizationOptions
    onOptionsChange: (options: ImageOptimizationOptions | undefined) => void
}

export default function ImageOptimizationPanel({ imageOptions, onOptionsChange }: ImageOptimizationPanelProps) {
    const [enabled, setEnabled] = useState(!!imageOptions)

    const handleToggle = (checked: boolean) => {
        setEnabled(checked)
        if (!checked) {
            onOptionsChange(undefined)
        } else {
            onOptionsChange({})
        }
    }

    const updateOptions = (updates: Partial<ImageOptimizationOptions>) => {
        onOptionsChange({ ...imageOptions, ...updates })
    }

    if (!enabled) {
        return (
            <div className="flex items-center space-x-2 p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <Checkbox
                    id="enable-image-opts"
                    checked={false}
                    onCheckedChange={handleToggle}
                />
                <label
                    htmlFor="enable-image-opts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                    <Image size={14} className="text-emerald-400" />
                    <span>Enable Image Optimizations</span>
                </label>
            </div>
        )
    }

    return (
        <div className="space-y-3 p-4 bg-zinc-900/30 rounded-lg border border-emerald-500/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="enable-image-opts"
                        checked={true}
                        onCheckedChange={handleToggle}
                    />
                    <label
                        htmlFor="enable-image-opts"
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                    >
                        <Image size={14} className="text-emerald-400" />
                        <span>Image Optimizations</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Resize */}
                <div className="col-span-2 space-y-2">
                    <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <Maximize2 size={12} />
                        Resize
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Input
                                type="number"
                                placeholder="Width"
                                value={imageOptions?.resize?.width || ''}
                                onChange={(e) => {
                                    const width = e.target.value ? parseInt(e.target.value) : undefined
                                    updateOptions({
                                        resize: { ...imageOptions?.resize, width },
                                    })
                                }}
                                className="h-8 text-xs"
                            />
                            <span className="text-xs text-zinc-600 mt-0.5 block">Width (px)</span>
                        </div>
                        <div>
                            <Input
                                type="number"
                                placeholder="Height"
                                value={imageOptions?.resize?.height || ''}
                                onChange={(e) => {
                                    const height = e.target.value ? parseInt(e.target.value) : undefined
                                    updateOptions({
                                        resize: { ...imageOptions?.resize, height },
                                    })
                                }}
                                className="h-8 text-xs"
                            />
                            <span className="text-xs text-zinc-600 mt-0.5 block">Height (px)</span>
                        </div>
                        <div>
                            <Select
                                value={imageOptions?.resize?.fit || 'inside'}
                                onValueChange={(fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside') => {
                                    updateOptions({
                                        resize: { ...imageOptions?.resize, fit },
                                    })
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inside">Inside</SelectItem>
                                    <SelectItem value="cover">Cover</SelectItem>
                                    <SelectItem value="contain">Contain</SelectItem>
                                    <SelectItem value="fill">Fill</SelectItem>
                                    <SelectItem value="outside">Outside</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-zinc-600 mt-0.5 block">Fit mode</span>
                        </div>
                    </div>
                </div>

                {/* Rotate */}
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <RotateCw size={12} />
                        Rotate
                    </Label>
                    <Select
                        value={imageOptions?.rotate?.toString() || '0'}
                        onValueChange={(val) => updateOptions({ rotate: parseInt(val) })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0°</SelectItem>
                            <SelectItem value="90">90°</SelectItem>
                            <SelectItem value="180">180°</SelectItem>
                            <SelectItem value="270">270°</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Strip Metadata */}
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <Info size={12} />
                        Privacy
                    </Label>
                    <div className="flex items-center space-x-2 h-8">
                        <Checkbox
                            id="strip-metadata"
                            checked={imageOptions?.stripMetadata || false}
                            onCheckedChange={(checked) =>
                                updateOptions({ stripMetadata: checked as boolean })
                            }
                        />
                        <label
                            htmlFor="strip-metadata"
                            className="text-xs text-zinc-400 cursor-pointer"
                        >
                            Strip metadata
                        </label>
                    </div>
                </div>
            </div>

            <div className="text-xs text-zinc-600 flex items-start gap-1 mt-2 p-2 bg-zinc-800/30 rounded">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                <span>Leave dimensions empty for original size. Rotation and metadata options apply to all images.</span>
            </div>
        </div>
    )
}
