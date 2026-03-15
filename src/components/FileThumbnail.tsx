import { useState, useEffect, memo } from 'react'
import { Image, FileText, Film, Music } from 'lucide-react'
import type { FileCategory } from '@/lib/formats'
import { getCategoryColor, getCategoryBgColor } from '@/lib/formats'

interface FileThumbnailProps {
  filePath: string
  category: FileCategory | null
}

function CategoryIcon({ category }: { category: FileCategory | null }) {
  const iconClass = `w-4 h-4 ${category ? getCategoryColor(category) : 'text-zinc-500'}`
  switch (category) {
    case 'image': return <Image className={iconClass} />
    case 'document': return <FileText className={iconClass} />
    case 'video': return <Film className={iconClass} />
    case 'audio': return <Music className={iconClass} />
    default: return <FileText className={iconClass} />
  }
}

/** Universal thumbnail component that handles all file types */
export const FileThumbnail = memo(function FileThumbnail({ filePath, category }: FileThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(false)

    window.electronAPI.generateThumbnail(filePath)
      .then((dataUrl) => {
        if (!cancelled) {
          if (dataUrl) {
            setThumbnail(dataUrl)
          } else {
            setError(true)
          }
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [filePath])

  // Loading state
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/30 animate-pulse" />
    )
  }

  // Error or no thumbnail - show category icon
  if (error || !thumbnail) {
    return (
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${
        category ? getCategoryBgColor(category) : 'bg-zinc-800/50 border-zinc-700/50'
      }`}>
        <CategoryIcon category={category} />
      </div>
    )
  }

  // Show thumbnail
  return (
    <img
      src={thumbnail}
      alt="Preview"
      className="w-10 h-10 rounded-lg object-cover border border-zinc-700/30"
      loading="lazy"
    />
  )
})
