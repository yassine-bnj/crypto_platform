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
  const [allHeatmapData, setAllHeatmapData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true)
      const data = await getHeatmapData("24h")
      if (data) {
        const transformed = transformHeatmapData(data)
        setAllHeatmapData(transformed)
        setHeatmapData(transformed.slice(0, 12))
      }
      setLoading(false)
    }

    fetchHeatmap()
  }, [])

  const toggleShowAll = () => {
    if (showAll) {
      setHeatmapData(allHeatmapData.slice(0, 12))
    } else {
      setHeatmapData(allHeatmapData)
    }
    setShowAll(!showAll)
  }

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
          {allHeatmapData.length > 12 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={toggleShowAll}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                {showAll ? "Show less" : `Show more (${allHeatmapData.length - 12} more)`}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
