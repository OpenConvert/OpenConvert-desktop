import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  FolderOpen,
  Search,
  ArrowRight,
  Filter,
  Image,
  FileText,
  Film,
  Music,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatFileSize, getFileCategory, getCategoryColor, getCategoryBgColor } from '@/lib/formats'
import type { FileCategory } from '@/lib/formats'

type StatusFilter = 'all' | 'completed' | 'failed'

function CategoryIcon({ category }: { category: FileCategory | null }) {
  const iconClass = `w-3.5 h-3.5 ${category ? getCategoryColor(category) : 'text-zinc-500'}`
  switch (category) {
    case 'image': return <Image className={iconClass} />
    case 'document': return <FileText className={iconClass} />
    case 'video': return <Film className={iconClass} />
    case 'audio': return <Music className={iconClass} />
    default: return <FileText className={iconClass} />
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: days > 365 ? 'numeric' : undefined,
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

function groupByDate(items: HistoryItem[]): { label: string; items: HistoryItem[] }[] {
  const groups: Map<string, HistoryItem[]> = new Map()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const lastWeek = today - 7 * 86400000

  for (const item of items) {
    let label: string
    if (item.created_at >= today) {
      label = 'Today'
    } else if (item.created_at >= yesterday) {
      label = 'Yesterday'
    } else if (item.created_at >= lastWeek) {
      label = 'Last 7 days'
    } else {
      label = 'Older'
    }

    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label)!.push(item)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

export default function HistoryView() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<HistoryStats>({ total: 0, completed: 0, failed: 0 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      const result = await window.electronAPI.getHistory({
        limit: ITEMS_PER_PAGE,
        offset,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, statusFilter, searchQuery])

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.electronAPI.getHistoryStats()
      setStats(s)
    } catch (err) {
      console.error('Failed to fetch history stats:', err)
    }
  }, [])

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchHistory()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery])

  const handleClearAll = useCallback(async () => {
    if (!confirm('Clear all conversion history? This cannot be undone.')) return
    try {
      await window.electronAPI.clearHistory()
      setItems([])
      setTotal(0)
      setStats({ total: 0, completed: 0, failed: 0 })
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [])

  const handleDeleteItem = useCallback(async (id: number) => {
    try {
      await window.electronAPI.deleteHistoryItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setTotal((prev) => prev - 1)
      fetchStats()
    } catch (err) {
      console.error('Failed to delete history item:', err)
    }
  }, [fetchStats])

  const handleShowInFolder = useCallback(async (filePath: string) => {
    try {
      await window.electronAPI.showInFolder(filePath)
    } catch (err) {
      console.error('Failed to show in folder:', err)
    }
  }, [])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startItem = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, total)

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const grouped = groupByDate(items)

  // ===== EMPTY STATE =====
  if (!isLoading && items.length === 0 && statusFilter === 'all' && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
            <Clock className="w-7 h-7 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-300">No conversion history</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Your converted files will appear here. Start by converting some files!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Conversion History</h1>
            <div className="flex items-center gap-3 mt-1">
              {stats.total > 0 && (
                <>
                  <span className="text-xs text-zinc-500">{stats.total} total</span>
                  <span className="text-xs text-emerald-500">{stats.completed} completed</span>
                  {stats.failed > 0 && (
                    <span className="text-xs text-red-400">{stats.failed} failed</span>
                  )}
                </>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-zinc-500 hover:text-red-400 gap-1.5"
            >
              <Trash2 size={14} />
              Clear all
            </Button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-9 h-8 text-xs bg-zinc-900 border-zinc-800 focus-visible:ring-violet-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-zinc-600" />
            {(['all', 'completed', 'failed'] as StatusFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'completed' ? 'Completed' : 'Failed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1 px-6">
        {isLoading && items.length === 0 ? (
          // Loading skeleton
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          // No results
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={32} className="text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No results found</p>
            <p className="text-xs text-zinc-600 mt-1">Try a different search or filter</p>
          </div>
        ) : (
          // Grouped list
          <div className="flex flex-col gap-5 pb-4">
            {grouped.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {group.items.map((item) => {
                    const category = getFileCategory(item.source_ext)
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:bg-zinc-900/80 ${
                          item.status === 'completed'
                            ? 'bg-zinc-900/30 border-zinc-800/50'
                            : 'bg-red-950/10 border-red-900/20'
                        }`}
                      >
                        {/* Category icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                          category ? getCategoryBgColor(category) : 'bg-zinc-800/50 border-zinc-700/50'
                        }`}>
                          <CategoryIcon category={category} />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-300 truncate">
                              {item.source_name}
                            </p>
                            <ArrowRight size={10} className="text-zinc-600 flex-shrink-0" />
                            <span className="text-xs font-mono text-zinc-500 uppercase flex-shrink-0">
                              {item.target_format}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-600">
                              {formatFileSize(item.source_size)}
                            </span>
                            <span className="text-xs text-zinc-700">*</span>
                            <span className="text-xs text-zinc-600">
                              {formatRelativeTime(item.created_at)}
                            </span>
                            {item.duration_ms > 0 && (
                              <>
                                <span className="text-xs text-zinc-700">*</span>
                                <span className="text-xs text-zinc-600">
                                  {formatDuration(item.duration_ms)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex-shrink-0">
                          {item.status === 'completed' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1">
                              <CheckCircle2 size={10} />
                              Done
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs gap-1" title={item.error_message ?? 'Unknown error'}>
                              <XCircle size={10} />
                              Failed
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.status === 'completed' && item.output_path && (
                            <button
                              onClick={() => handleShowInFolder(item.output_path)}
                              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                              title="Show in folder"
                            >
                              <FolderOpen size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                            title="Remove from history"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-3 px-1 border-t border-zinc-800/30 mt-2">
                <div className="text-xs text-zinc-600">
                  Showing {startItem}-{endItem} of {total} conversions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed h-7 px-2"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-xs text-zinc-500 min-w-[60px] text-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed h-7 px-2"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error display for failed items */}
      {items.some((i) => i.status === 'failed' && i.error_message) && statusFilter === 'failed' && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-zinc-800/30 bg-red-950/10">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={12} />
            <span>Some conversions failed. Hover over failed items to see error details.</span>
          </div>
        </div>
      )}
    </div>
  )
}
