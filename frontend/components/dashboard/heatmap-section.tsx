"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { getHeatmapData, transformHeatmapData } from "@/lib/api-service"

interface HeatmapData {
  symbol: string
  name: string
  change24h: number
}

export default function HeatmapSection({ selectedAssets }: { selectedAssets: string[] }) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true)
      const data = await getHeatmapData("24h")
      if (data) {
        const transformed = transformHeatmapData(data)
        const filtered = transformed.slice(0, 12)
        setHeatmapData(filtered)
      }
      setLoading(false)
    }

    fetchHeatmap()
  }, [])

  const getHeatmapColor = (change: number): string => {
    if (change >= 10) return "bg-chart-2/90"
    if (change >= 5) return "bg-chart-2/70"
    if (change >= 0) return "bg-chart-2/40"
    if (change >= -5) return "bg-destructive/40"
    if (change >= -10) return "bg-destructive/70"
    return "bg-destructive/90"
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Market Heatmap</h2>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-muted rounded-lg p-4 h-24 animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Market Heatmap</h2>
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {heatmapData.map((item) => (
              <div
                key={item.symbol}
                className={`${getHeatmapColor(item.change24h)} rounded-lg p-4 text-center transition-all hover:scale-105 cursor-pointer border border-border`}
              >
                <p className="font-bold text-sm mb-1">{item.symbol}</p>
                <p className={`text-xs font-semibold ${item.change24h >= 0 ? "text-chart-2" : "text-destructive"}`}>
                  {item.change24h >= 0 ? "+" : ""}
                  {item.change24h.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
