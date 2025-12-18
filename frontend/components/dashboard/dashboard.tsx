"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"
import MarketOverview from "@/components/dashboard/market-overview"
import AdvancedCharts from "@/components/dashboard/advanced-charts"
import HeatmapSection from "@/components/dashboard/heatmap-section"
import PortfolioSection from "@/components/dashboard/portfolio-section"

export default function Dashboard() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["BTC", "ETH"])
  const [timeRange, setTimeRange] = useState("24h")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background text-foreground">
      {sidebarOpen && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          selectedAssets={selectedAssets}
          onAssetsChange={setSelectedAssets}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Market Overview */}
            <MarketOverview selectedAssets={selectedAssets} />

            {/* Advanced Charts */}
            <AdvancedCharts selectedAssets={selectedAssets} timeRange={timeRange} />

            {/* Heatmap */}
            <HeatmapSection selectedAssets={selectedAssets} />

            {/* Portfolio */}
            {/* <PortfolioSection /> */}
          </div>
        </div>
      </div>
    </div>
  )
}
