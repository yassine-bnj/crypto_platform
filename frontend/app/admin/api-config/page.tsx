"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Save, RotateCcw } from "lucide-react"

interface APIConfig {
  source: string
  enabled: boolean
  frequency: number
  lastSync: string
  status: "connected" | "disconnected" | "error"
}

const defaultConfigs: APIConfig[] = [
  { source: "Binance", enabled: true, frequency: 5, lastSync: "2024-12-11 14:32:15", status: "connected" },
  { source: "CoinGecko", enabled: true, frequency: 10, lastSync: "2024-12-11 14:31:42", status: "connected" },
  { source: "Kraken", enabled: false, frequency: 15, lastSync: "2024-12-10 18:20:00", status: "disconnected" },
  { source: "Coinbase", enabled: true, frequency: 20, lastSync: "2024-12-11 14:29:55", status: "connected" },
]

export default function APIConfig() {
  const [configs, setConfigs] = useState<APIConfig[]>(defaultConfigs)
  const [changes, setChanges] = useState(false)

  const handleFrequencyChange = (index: number, frequency: number) => {
    const newConfigs = [...configs]
    newConfigs[index].frequency = frequency
    setConfigs(newConfigs)
    setChanges(true)
  }

  const handleToggleAPI = (index: number) => {
    const newConfigs = [...configs]
    newConfigs[index].enabled = !newConfigs[index].enabled
    setConfigs(newConfigs)
    setChanges(true)
  }

  const handleSave = () => {
    setChanges(false)
    console.log("Settings saved:", configs)
  }

  const handleReset = () => {
    setConfigs(defaultConfigs)
    setChanges(false)
  }

  const getStatusIcon = (status: string) => {
    const statusIcons = {
      connected: "bg-green-500/20 text-green-400",
      disconnected: "bg-gray-500/20 text-gray-400",
      error: "bg-red-500/20 text-red-400",
    }
    return statusIcons[status as keyof typeof statusIcons]
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Configuration</h1>
            <p className="text-muted-foreground mt-2">Manage data sources and sync frequency</p>
          </div>

          {/* API Sources */}
          <div className="space-y-4">
            {configs.map((config, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    {/* Source Name */}
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="text-lg font-semibold text-foreground">{config.source}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusIcon(config.status)}`}
                      >
                        {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
                      </span>
                    </div>

                    {/* Last Sync */}
                    <div>
                      <p className="text-sm text-muted-foreground">Last Sync</p>
                      <p className="text-sm text-foreground mt-1">{config.lastSync}</p>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="text-sm text-muted-foreground block">Sync Frequency (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={config.frequency}
                        onChange={(e) => handleFrequencyChange(index, Number.parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 bg-sidebar border border-border rounded text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Toggle */}
                    <div className="flex items-end">
                      <button
                        onClick={() => handleToggleAPI(index)}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          config.enabled
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-gray-600 text-gray-200 hover:bg-gray-700"
                        }`}
                      >
                        {config.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={!changes}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex items-center gap-2 bg-transparent">
              <RotateCcw size={18} />
              Reset
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
