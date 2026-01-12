"use client"

import { useEffect, useState } from "react"
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
import { authFetch, API_BASE_URL } from "@/lib/api-service"

interface DashboardStats {
  total_users: number
  users_growth: string
  active_sessions: number
  sessions_growth: string
  api_calls_24h: number
  api_growth: string
  system_health: number
  health_status: string
}

interface UserGrowthData {
  month: string
  users: number
  active: number
}

interface ApiUsageData {
  time: string
  requests: number
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [apiUsageData, setApiUsageData] = useState<ApiUsageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[AdminDashboard] Auth status:', { isAuthenticated, isLoading })
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user?.is_staff) return
      
      try {
        setLoading(true)
        const response = await authFetch(`${API_BASE_URL}/admin/dashboard/stats/`, { method: 'GET' })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.stats) {
          setStats(data.stats)
        }
        if (data.user_growth_data) {
          setUserGrowthData(data.user_growth_data)
        }
        if (data.api_usage_data) {
          setApiUsageData(data.api_usage_data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, user])

  if (isLoading || !isAuthenticated) {
    return null
  }

  const dashboardStats = stats ? [
    { 
      label: "Total Users", 
      value: stats.total_users.toLocaleString(), 
      icon: Users, 
      change: stats.users_growth 
    },
    { 
      label: "Active Sessions", 
      value: stats.active_sessions.toLocaleString(), 
      icon: BarChart3, 
      change: stats.sessions_growth 
    },
    { 
      label: "API Calls (24h)", 
      value: stats.api_calls_24h.toLocaleString(), 
      icon: Server, 
      change: stats.api_growth 
    },
    { 
      label: "System Health", 
      value: `${stats.system_health}%`, 
      icon: AlertCircle, 
      change: stats.health_status 
    },
  ] : []

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

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          )}

          {/* Stats Grid */}
          {!loading && stats && (
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
          )}

          {/* Charts */}
          {!loading && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Monthly user registrations and activity</CardDescription>
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
                      <Bar dataKey="users" fill="#FFA500" name="Total Users" />
                      <Bar dataKey="active" fill="#10B981" name="Active Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* API Usage Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>API Usage (24h)</CardTitle>
                  <CardDescription>Requests per time interval</CardDescription>
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
                      <Line type="monotone" dataKey="requests" stroke="#FFA500" strokeWidth={2} dot={false} name="API Requests" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
