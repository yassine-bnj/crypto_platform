"use client"

import { Search, Bell, User, Menu, X, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"

interface HeaderProps {
  timeRange: string
  onTimeRangeChange: (range: string) => void
  selectedAssets: string[]
  onAssetsChange: (assets: string[]) => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Header({
  timeRange,
  onTimeRangeChange,
  selectedAssets,
  onAssetsChange,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const timeRanges = ["1h", "4h", "24h", "7d", "1M", "1Y"]
  const cryptoAssets = ["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE"]
  const { theme, toggleTheme } = useTheme()

  const toggleAsset = (asset: string) => {
    onAssetsChange(
      selectedAssets.includes(asset) ? selectedAssets.filter((a) => a !== asset) : [...selectedAssets, asset],
    )
  }

  return (
    <div className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-secondary rounded-lg transition-colors mr-4"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} className="text-accent" /> : <Menu size={20} className="text-accent" />}
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-6">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={20} className="text-muted-foreground" />
            ) : (
              <Sun size={20} className="text-muted-foreground" />
            )}
          </button>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Bell size={20} className="text-muted-foreground" />
          </button>
          <Link href="/profile" className="p-2 hover:bg-secondary rounded-lg transition-colors block">
            <User size={20} className="text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Timeframe:</span>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Assets:</span>
          <div className="flex gap-1">
            {cryptoAssets.map((asset) => (
              <button
                key={asset}
                onClick={() => toggleAsset(asset)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedAssets.includes(asset)
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
