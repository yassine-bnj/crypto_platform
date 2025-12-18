"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { AlertCircle, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const systemMetrics = [
  { label: "CPU Usage", value: "42%", status: "normal" as const },
  { label: "Memory Usage", value: "68%", status: "warning" as const },
  { label: "Database Latency", value: "142ms", status: "normal" as const },
  { label: "API Response Time", value: "287ms", status: "warning" as const },
]

const performanceData = [
  { time: "00:00", cpu: 30, memory: 45, latency: 120 },
  { time: "04:00", cpu: 35, memory: 50, latency: 135 },
  { time: "08:00", cpu: 42, memory: 62, latency: 150 },
  { time: "12:00", cpu: 50, memory: 70, latency: 180 },
  { time: "16:00", cpu: 45, memory: 68, latency: 165 },
  { time: "20:00", cpu: 38, memory: 55, latency: 145 },
  { time: "24:00", cpu: 32, memory: 48, latency: 125 },
]

const systemLogs = [
  { time: "14:32:15", level: "info", message: "Successfully synced data from Binance API", source: "Binance" },
  { time: "14:31:42", level: "info", message: "Successfully synced data from CoinGecko API", source: "CoinGecko" },
  { time: "14:28:20", level: "warning", message: "High memory usage detected: 75%", source: "System" },
  { time: "14:20:10", level: "info", message: "User authentication successful", source: "Auth" },
  { time: "14:15:35", level: "error", message: "Failed to connect to Kraken API", source: "Kraken" },
  { time: "14:10:22", level: "info", message: "Database backup completed", source: "Database" },
]

export default function SystemMonitoring() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "info":
        return "bg-blue-500/20 text-blue-400"
      case "warning":
        return "bg-yellow-500/20 text-yellow-400"
      case "error":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
            <p className="text-muted-foreground mt-2">Monitor system health and performance metrics</p>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.map((metric, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    {metric.status === "normal" && <CheckCircle className="text-green-400" size={24} />}
                    {metric.status === "warning" && <AlertCircle className="text-yellow-400" size={24} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>System Performance (24h)</CardTitle>
              <CardDescription>CPU, Memory, and Database Latency trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,165,0,0.1)" />
                  <XAxis dataKey="time" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,165,0,0.3)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#FFA500" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="memory" stroke="#14B8A6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="latency" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Logs */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system and API activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-sidebar">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getLogLevelColor(log.level)}`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground break-words">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.time} · {log.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
