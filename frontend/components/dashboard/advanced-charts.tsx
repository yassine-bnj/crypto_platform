"use client"

import { 
  ComposedChart, 
  Bar, 
  LineChart, 
  Line, 
  Area,
  AreaChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { getThemeColors } from "@/components/theme-aware-colors"
import { getOHLCData, transformOHLCToChart, getIndicators } from "@/lib/api-service"
import { TrendingUp, TrendingDown, Activity, BarChart3, LineChartIcon, Maximize2 } from "lucide-react"

export default function AdvancedCharts({
  selectedAssets,
  timeRange,
}: {
  selectedAssets: string[]
  timeRange: string
}) {
  const [chartType, setChartType] = useState<"line" | "area" | "candlestick" | "volume">("area")
  const [chartData, setChartData] = useState<Record<string, any[]>>({})
  const [indicators, setIndicators] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showIndicators, setShowIndicators] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const colors = getThemeColors(isDark)

  const assetColors = [
    colors.lineStroke,
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ]

  // Format X-axis based on time range
  const formatXAxis = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      
      if (isNaN(date.getTime())) {
        return timeStr
      }
      
      if (timeRange === "1h" || timeRange === "24h") {
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      } else if (timeRange === "7d") {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    } catch {
      return timeStr
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      if (selectedAssets.length === 0) {
        setLoading(false)
        return
      }

      const interval = timeRange === "1h" ? "1m" : timeRange === "24h" ? "15m" : "1h"
      const newChartData: Record<string, any[]> = {}
      const newIndicators: Record<string, any> = {}

      await Promise.all(
        selectedAssets.map(async (symbol) => {
          const ohlcData = await getOHLCData(symbol, interval, timeRange)
          const indicatorsData = await getIndicators(symbol)

          if (ohlcData) {
            const transformed = transformOHLCToChart(ohlcData)
            newChartData[symbol] = transformed
          }

          if (indicatorsData) {
            newIndicators[symbol] = indicatorsData
          }
        })
      )

      setChartData(newChartData)
      setIndicators(newIndicators)
      setLoading(false)
    }

    fetchData()
  }, [selectedAssets, timeRange])

  // Merge data for comparison mode
  const mergedData = compareMode && selectedAssets.length > 1
    ? (() => {
        const timePoints = new Set<string>()
        Object.values(chartData).forEach((data) => {
          data.forEach((point) => timePoints.add(point.timestamp))
        })

        return Array.from(timePoints)
          .sort()
          .map((timestamp) => {
            const point: any = { timestamp, time: timestamp }
            selectedAssets.forEach((symbol) => {
              const symbolData = chartData[symbol]?.find((d) => d.timestamp === timestamp)
              if (symbolData) {
                point[`${symbol}_close`] = symbolData.close
                point[`${symbol}_volume`] = symbolData.volume
              }
            })
            return point
          })
      })()
    : chartData[selectedAssets[0]] || []

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold">
                ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Advanced Charts
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Chart Type Selector */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                chartType === "area"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              Area
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                chartType === "line"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Line
            </button>
            <button
              onClick={() => setChartType("candlestick")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                chartType === "candlestick"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Candles
            </button>
          </div>

          {/* View Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showVolume
                  ? "bg-accent/20 text-accent border border-accent/50"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showIndicators
                  ? "bg-accent/20 text-accent border border-accent/50"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              Indicators
            </button>
            {selectedAssets.length > 1 && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  compareMode
                    ? "bg-accent/20 text-accent border border-accent/50"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                Compare
              </button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {compareMode && selectedAssets.length > 1 
                ? `${selectedAssets.join(" vs ")} - ${timeRange}`
                : `${selectedAssets[0]} / USD - ${timeRange}`}
            </span>
            <button className="p-1.5 hover:bg-secondary rounded transition-colors">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {compareMode && selectedAssets.length > 1 ? (
                <LineChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    {selectedAssets.map((symbol, idx) => (
                      <linearGradient key={symbol} id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={assetColors[idx]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={assetColors[idx]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                  />
                  {selectedAssets.map((symbol, idx) => (
                    <Line
                      key={symbol}
                      type="monotone"
                      dataKey={`${symbol}_close`}
                      name={symbol}
                      stroke={assetColors[idx]}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  ))}
                </LineChart>
              ) : chartType === "area" ? (
                <ComposedChart 
                  data={mergedData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: showVolume ? 60 : 10 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.lineStroke} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.lineStroke} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis 
                    yAxisId="price"
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  {showVolume && (
                    <YAxis 
                      yAxisId="volume"
                      orientation="right"
                      stroke={colors.axisStroke}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  {showIndicators && indicators[selectedAssets[0]]?.SMA_7 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="sma7"
                      name="SMA(7)"
                      stroke="#22c55e"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}
                  {showIndicators && indicators[selectedAssets[0]]?.SMA_25 && (
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="sma25"
                      name="SMA(25)"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="close"
                    name="Price"
                    stroke={colors.lineStroke}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                  {showVolume && (
                    <Bar
                      yAxisId="volume"
                      dataKey="volume"
                      name="Volume"
                      fill={colors.lineStroke}
                      opacity={0.3}
                      animationDuration={500}
                    />
                  )}
                </ComposedChart>
              ) : chartType === "line" ? (
                <LineChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="close"
                    name="Price"
                    stroke={colors.lineStroke}
                    strokeWidth={3}
                    dot={false}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              ) : (
                <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis 
                    stroke={colors.axisStroke}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar 
                    dataKey="high" 
                    name="High-Low"
                    fill={colors.lineStroke} 
                    opacity={0.6} 
                    animationDuration={500}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    name="Close"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators */}
      {selectedAssets.length > 0 && (
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {selectedAssets.map((symbol) => {
                const indicator = indicators[symbol]
                
                return (
                  <div key={symbol} className="space-y-3">
                    <div className="text-xs font-semibold text-accent border-b border-border pb-1">
                      {symbol}
                    </div>
                    {indicator ? (
                      <>
                        <IndicatorCard
                          label="SMA (7)"
                          value={indicator.SMA_7 ? `$${indicator.SMA_7.toFixed(2)}` : "N/A"}
                          status="neutral"
                          trend={indicator.SMA_7 > indicator.SMA_25 ? "up" : "down"}
                        />
                        <IndicatorCard
                          label="SMA (25)"
                          value={indicator.SMA_25 ? `$${indicator.SMA_25.toFixed(2)}` : "N/A"}
                          status="neutral"
                          trend={indicator.SMA_25 > indicator.SMA_7 ? "down" : "up"}
                        />
                      </>
                    ) : (
                      <div className="bg-secondary/30 rounded-lg p-3 border border-dashed border-border/50">
                        <p className="text-xs text-muted-foreground text-center">
                          No data available
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function IndicatorCard({
  label,
  value,
  status,
  trend,
}: {
  label: string
  value: string
  status: "overbought" | "oversold" | "bullish" | "bearish" | "neutral" | "above" | "below"
  trend?: "up" | "down"
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
    <div className="bg-secondary/30 rounded-lg p-2.5 border border-border/50 hover:border-accent/50 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        {trend && (
          trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-chart-2" />
          ) : (
            <TrendingDown className="w-3 h-3 text-destructive" />
          )
        )}
      </div>
      <p className="text-sm font-bold group-hover:text-accent transition-colors">{value}</p>
    </div>
  )
}
