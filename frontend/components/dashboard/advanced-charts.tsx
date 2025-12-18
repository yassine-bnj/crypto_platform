"use client"

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { getThemeColors } from "@/components/theme-aware-colors"
import { getOHLCData, transformOHLCToChart, getIndicators } from "@/lib/api-service"

export default function AdvancedCharts({
  selectedAssets,
  timeRange,
}: {
  selectedAssets: string[]
  timeRange: string
}) {
  const [chartType, setChartType] = useState<"line" | "candlestick">("line")
  const [chartData, setChartData] = useState<any[]>([])
  const [indicators, setIndicators] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const colors = getThemeColors(isDark)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      if (selectedAssets.length === 0) {
        setLoading(false)
        return
      }

      const symbol = selectedAssets[0]
      const interval = timeRange === "24h" ? "1h" : "4h"

      const ohlcData = await getOHLCData(symbol, interval, timeRange)
      console.log("OHLC Data:", ohlcData)
      const indicatorsData = await getIndicators(symbol)
      console.log("Indicators Data:", indicatorsData)

      if (ohlcData) {
          console.log("OHLC Data: if ", ohlcData)
        const transformed = transformOHLCToChart(ohlcData)
        setChartData(transformed)
      }

      if (indicatorsData) {
        console.log("Indicators Data: if ", indicatorsData)
        setIndicators(indicatorsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [selectedAssets, timeRange])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Price Charts</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("line")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              chartType === "line"
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-foreground hover:border-accent/50"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("candlestick")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              chartType === "candlestick"
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-border text-foreground hover:border-accent/50"
            }`}
          >
            Candlestick
          </button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>
            {selectedAssets[0]} / USD - {timeRange}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                  <XAxis dataKey="time" stroke={colors.axisStroke} />
                  <YAxis stroke={colors.axisStroke} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                    }}
                    labelStyle={{ color: colors.tooltipText }}
                    formatter={(value: any) => [value.toFixed(2), "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={colors.lineStroke}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                  <XAxis dataKey="time" stroke={colors.axisStroke} />
                  <YAxis stroke={colors.axisStroke} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                    }}
                    labelStyle={{ color: colors.tooltipText }}
                  />
                  <Bar dataKey="high" fill={colors.lineStroke} opacity={0.7} isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {indicators ? (
              <>
                <IndicatorCard
                  label="SMA (7)"
                  value={indicators.SMA_7 ? `$${indicators.SMA_7.toFixed(2)}` : "N/A"}
                  status="neutral"
                />
                <IndicatorCard
                  label="SMA (25)"
                  value={indicators.SMA_25 ? `$${indicators.SMA_25.toFixed(2)}` : "N/A"}
                  status="neutral"
                />
                <IndicatorCard
                  label="RSI"
                  value={indicators.RSI ? indicators.RSI.toFixed(1) : "N/A"}
                  status="neutral"
                />
                <IndicatorCard
                  label="MACD"
                  value={indicators.MACD ? indicators.MACD.toFixed(2) : "N/A"}
                  status="neutral"
                />
              </>
            ) : (
              <IndicatorCard label="Loading..." value="..." status="neutral" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IndicatorCard({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: "overbought" | "oversold" | "bullish" | "bearish" | "neutral" | "above" | "below"
}) {
  const statusColors = {
    overbought: "text-destructive",
    oversold: "text-chart-2",
    bullish: "text-chart-2",
    bearish: "text-destructive",
    neutral: "text-muted-foreground",
    above: "text-chart-2",
    below: "text-destructive",
  }

  return (
    <div className="bg-secondary/50 rounded-lg p-3 border border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold mb-1">{value}</p>
      <p className={`text-xs font-semibold capitalize ${statusColors[status]}`}>{status}</p>
    </div>
  )
}
