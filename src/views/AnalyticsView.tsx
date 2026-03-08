import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  HardDrive,
  Zap,
  CheckCircle2,
  XCircle,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatFileSize } from '@/config/formats'

interface AnalyticsData {
  totalConversions: number
  successfulConversions: number
  failedConversions: number
  totalFilesSize: number
  totalDuration: number
  averageDuration: number
  topSourceFormats: Array<{ format: string; count: number }>
  topTargetFormats: Array<{ format: string; count: number }>
  conversionsByCategory: Array<{ category: string; count: number }>
  recentTrend: Array<{ date: string; count: number }>
  fastestConversion: { name: string; duration: number } | null
  slowestConversion: { name: string; duration: number } | null
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  colorClass = 'text-violet-400',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | null
  colorClass?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-4 backdrop-blur-sm transition-all hover:border-zinc-700/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={16} className={`${colorClass} flex-shrink-0`} />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {trend && (
              <span
                className={`flex items-center text-xs font-medium ${
                  trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs text-zinc-600 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await window.electronAPI.getAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics || analytics.totalConversions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-300">No Data Yet</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Start converting files to see your analytics and statistics here!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const successRate = ((analytics.successfulConversions / analytics.totalConversions) * 100).toFixed(1)
  const avgSizeFormatted = formatFileSize(analytics.totalFilesSize / analytics.totalConversions)

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-violet-400" />
            Analytics & Statistics
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Insights from your file conversions
          </p>
        </div>

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Total Conversions"
            value={analytics.totalConversions.toLocaleString()}
            subtext="All time"
            colorClass="text-violet-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Success Rate"
            value={`${successRate}%`}
            subtext={`${analytics.successfulConversions} successful`}
            trend={parseFloat(successRate) >= 95 ? 'up' : parseFloat(successRate) < 80 ? 'down' : null}
            colorClass="text-emerald-400"
          />
          <StatCard
            icon={Clock}
            label="Avg Duration"
            value={`${(analytics.averageDuration / 1000).toFixed(1)}s`}
            subtext="Per conversion"
            colorClass="text-blue-400"
          />
          <StatCard
            icon={HardDrive}
            label="Avg File Size"
            value={avgSizeFormatted}
            subtext={formatFileSize(analytics.totalFilesSize) + ' total'}
            colorClass="text-amber-400"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Source Formats */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" />
              Most Converted From
            </h3>
            <div className="space-y-3">
              {analytics.topSourceFormats.slice(0, 5).map((item, index) => {
                const percentage = ((item.count / analytics.totalConversions) * 100).toFixed(0)
                return (
                  <div key={item.format} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono text-zinc-600 w-6">{index + 1}.</span>
                      <Badge variant="secondary" className="uppercase font-mono text-xs">
                        {item.format}
                      </Badge>
                      <span className="text-sm text-zinc-500">{item.count} files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Target Formats */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Most Converted To
            </h3>
            <div className="space-y-3">
              {analytics.topTargetFormats.slice(0, 5).map((item, index) => {
                const percentage = ((item.count / analytics.totalConversions) * 100).toFixed(0)
                return (
                  <div key={item.format} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono text-zinc-600 w-6">{index + 1}.</span>
                      <Badge variant="secondary" className="uppercase font-mono text-xs">
                        {item.format}
                      </Badge>
                      <span className="text-sm text-zinc-500">{item.count} files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Conversions by Category</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.conversionsByCategory.map((cat) => {
              const Icon =
                cat.category === 'image'
                  ? Zap
                  : cat.category === 'document'
                  ? CheckCircle2
                  : cat.category === 'video'
                  ? Clock
                  : HardDrive
              const color =
                cat.category === 'image'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : cat.category === 'document'
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  : cat.category === 'video'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-pink-400 bg-pink-500/10 border-pink-500/20'
              return (
                <div
                  key={cat.category}
                  className={`rounded-lg border p-3 ${color}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} />
                    <span className="text-xs font-medium capitalize">{cat.category}</span>
                  </div>
                  <div className="text-xl font-bold">{cat.count}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {((cat.count / analytics.totalConversions) * 100).toFixed(0)}% of total
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance Stats */}
        {analytics.fastestConversion && analytics.slowestConversion && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-300">Fastest Conversion</h3>
              </div>
              <p className="text-xs text-zinc-400 truncate mb-1">{analytics.fastestConversion.name}</p>
              <p className="text-lg font-bold text-emerald-400">
                {(analytics.fastestConversion.duration / 1000).toFixed(2)}s
              </p>
            </div>
            <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-300">Slowest Conversion</h3>
              </div>
              <p className="text-xs text-zinc-400 truncate mb-1">{analytics.slowestConversion.name}</p>
              <p className="text-lg font-bold text-amber-400">
                {(analytics.slowestConversion.duration / 1000).toFixed(2)}s
              </p>
            </div>
          </div>
        )}

        {/* Failed Conversions */}
        {analytics.failedConversions > 0 && (
          <div className="rounded-xl border border-red-800/30 bg-red-950/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={16} className="text-red-400" />
              <h3 className="text-sm font-semibold text-red-300">Failed Conversions</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-red-400">{analytics.failedConversions}</span>
              <span className="text-sm text-zinc-500">
                ({((analytics.failedConversions / analytics.totalConversions) * 100).toFixed(1)}% failure rate)
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Check the History tab to view error details and retry failed conversions
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
