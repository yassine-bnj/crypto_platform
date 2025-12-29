"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { BarChart3, Users, Server, AlertCircle } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const dashboardStats = [
  { label: "Total Users", value: "1,234", icon: Users, change: "+12%" },
  { label: "Active Sessions", value: "567", icon: BarChart3, change: "+8%" },
  { label: "API Calls (24h)", value: "45,231", icon: Server, change: "+23%" },
  { label: "System Health", value: "98.5%", icon: AlertCircle, change: "Optimal" },
]

const userGrowthData = [
  { month: "Jan", users: 400, active: 240 },
  { month: "Feb", users: 520, active: 310 },
  { month: "Mar", users: 680, active: 420 },
  { month: "Apr", users: 890, active: 560 },
  { month: "May", users: 1050, active: 670 },
  { month: "Jun", users: 1234, active: 780 },
]

const apiUsageData = [
  { time: "00:00", binance: 2400, coingecko: 2210 },
  { time: "04:00", binance: 2210, coingecko: 2290 },
  { time: "08:00", binance: 2290, coingecko: 2000 },
  { time: "12:00", binance: 2000, coingecko: 2181 },
  { time: "16:00", binance: 2181, coingecko: 2500 },
  { time: "20:00", binance: 2500, coingecko: 2100 },
  { time: "24:00", binance: 2100, coingecko: 2300 },
]

export default function AdminDashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[AdminDashboard] Auth status:', { isAuthenticated, isLoading })
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Monitor system health and user activity</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <Card key={i} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                      <Icon className="text-primary" size={20} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-accent mt-2">{stat.change}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Total users vs active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,165,0,0.1)" />
                    <XAxis dataKey="month" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,165,0,0.3)" }}
                    />
                    <Legend />
                    <Bar dataKey="users" fill="#FFA500" />
                    <Bar dataKey="active" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* API Usage Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>API Usage (24h)</CardTitle>
                <CardDescription>API calls by source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={apiUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,165,0,0.1)" />
                    <XAxis dataKey="time" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,165,0,0.3)" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="binance" stroke="#FFA500" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="coingecko" stroke="#14B8A6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
