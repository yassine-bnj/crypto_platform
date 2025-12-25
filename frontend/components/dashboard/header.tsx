"use client"

import { Search, Bell, User, Menu, X, Moon, Sun, ChevronDown, Check } from "lucide-react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [cryptoAssets, setCryptoAssets] = useState<string[]>([])
  const [assetsDropdownOpen, setAssetsDropdownOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  // Fetch available assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/assets/')
        if (response.ok) {
          const data = await response.json()
          console.log('Fetched assets:', data)
          const symbols = data.map((asset: any) => asset.symbol)
          setCryptoAssets(symbols)
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error)
        // Fallback to default assets if API fails
        setCryptoAssets(["BTC", "ETH", "XRP", "SOL", "ADA", "DOGE"])
      }
    }
    fetchAssets()
  }, [])

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

        {/* Asset Selection - Multi-select Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Assets:</span>
          <Popover open={assetsDropdownOpen} onOpenChange={setAssetsDropdownOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm hover:bg-secondary transition-colors min-w-[200px] justify-between">
                <span className="text-foreground font-medium">
                  {selectedAssets.length > 0 
                    ? `${selectedAssets.length} selected: ${selectedAssets.join(", ")}` 
                    : "Select assets..."}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-3 border-b border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Select Cryptocurrencies
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-3">
                <div className="space-y-2">
                  {cryptoAssets.length > 0 ? (
                    cryptoAssets.map((asset) => (
                      <div
                        key={asset}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => toggleAsset(asset)}
                      >
                        <Checkbox
                          id={asset}
                          checked={selectedAssets.includes(asset)}
                          onCheckedChange={() => toggleAsset(asset)}
                          className="border-muted-foreground"
                        />
                        <label
                          htmlFor={asset}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {asset}
                        </label>
                        {selectedAssets.includes(asset) && (
                          <Check className="w-4 h-4 text-accent" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Loading assets...
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
