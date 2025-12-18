"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { useState, useEffect } from "react"
import { getPriceHistory } from "@/lib/api-service"

interface Asset {
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

export default function MarketOverview({ selectedAssets }: { selectedAssets: string[] }) {
  const [assets, setAssets] = useState<Record<string, Asset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true)
      const assetData: Record<string, Asset> = {}

      for (const symbol of selectedAssets) {
        const data = await getPriceHistory(symbol, "7d")
        if (data && data.length > 0) {
          const latest = data[data.length - 1]
          assetData[symbol] = {
            symbol: symbol,
            name: latest.name,
            price: Number.parseFloat(latest.price_usd),
            change24h: latest.price_change_percentage_24h,
            marketCap: Number.parseFloat(latest.market_cap),
            volume24h: Number.parseFloat(latest.volume_24h),
          }
        }
      }

      setAssets(assetData)
      setLoading(false)
    }

    if (selectedAssets.length > 0) {
      fetchAssets()
    }
  }, [selectedAssets])

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedAssets.map((symbol) => (
            <div key={symbol} className="bg-card border border-border/50 rounded-xl p-5 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedAssets.map((symbol) => {
          const asset = assets[symbol]
          if (!asset) return null

          const isPositive = asset.change24h >= 0

          return (
            <div
              key={symbol}
              className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl p-5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {asset.symbol}
                  </h3>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
                {isPositive ? (
                  <TrendingUp size={24} className="text-success" />
                ) : (
                  <TrendingDown size={24} className="text-destructive" />
                )}
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground">${asset.price.toFixed(2)}</p>
                <p className={`text-sm font-semibold mt-2 ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? "↑" : "↓"} {Math.abs(asset.change24h).toFixed(2)}%
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/30">
                <div className="flex justify-between">
                  <span>Market Cap</span>
                  <span className="text-foreground font-medium">${(asset.marketCap / 1000000000).toFixed(0)}B</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume 24h</span>
                  <span className="text-foreground font-medium">${(asset.volume24h / 1000000000).toFixed(1)}B</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
