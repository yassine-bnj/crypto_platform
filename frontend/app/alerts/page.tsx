"use client"

import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth"
import { useRouter } from "next/navigation"
import { authFetch, API_BASE_URL } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import NewAlertModal from "@/components/alerts/new-alert-modal"

export default function AlertsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alerts, setAlerts] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Array<any>>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, authLoading, router])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const resp = await authFetch(`${API_BASE_URL}/alerts/`)
      if (!resp.ok) throw new Error('Failed to load alerts')
      const data = await resp.json().catch(() => [])
      setAlerts(data)
    } catch (e) {
      console.error('Error loading alerts', e)
      toast({ title: 'Error', description: 'Could not load alerts' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // refetch when modal closes (new alert created)
  useEffect(() => {
    if (!isModalOpen) fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen])

  const fetchNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const resp = await authFetch(`${API_BASE_URL}/notifications/`)
      if (!resp.ok) throw new Error('Failed to load notifications')
      const data = await resp.json().catch(() => [])
      setNotifications(data)
    } catch (e) {
      console.error('Error loading notifications', e)
      toast({ title: 'Error', description: 'Could not load notifications' })
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: number) => {
    try {
      const resp = await authFetch(`${API_BASE_URL}/alerts/${id}/`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Delete failed')
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Alert deleted' })
    } catch (e) {
      toast({ title: 'Error', description: 'Could not delete alert' })
    }
  }

  const handleReactivate = async (id: number) => {
    try {
      const resp = await authFetch(`${API_BASE_URL}/alerts/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      if (!resp.ok) throw new Error('Reactivate failed')
      const updated = await resp.json().catch(() => null)
      setAlerts((prev) => prev.map((a) => (a.id === id ? (updated || { ...a, is_active: true }) : a)))
      toast({ title: 'Alert reactivated' })
    } catch (e) {
      toast({ title: 'Error', description: 'Could not reactivate alert' })
    }
  }

  const markNotificationRead = async (id: number) => {
    try {
      const resp = await authFetch(`${API_BASE_URL}/notifications/${id}/read/`, { method: 'POST' })
      if (!resp.ok) throw new Error('Mark read failed')
      // update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      toast({ title: 'Marked read' })
    } catch (e) {
      toast({ title: 'Error', description: 'Could not mark notification' })
    }
  }

  if (authLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Price Alerts</h1>
              <p className="text-muted-foreground mt-1">Set price alerts for your favorite assets</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              <Plus size={18} /> New Alert
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Card className="bg-card border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} className="text-accent" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
                  {!loading && alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts yet</p>}
                  {alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{alert.asset_symbol || alert.asset?.symbol || alert.asset}</p>
                        <p className="text-sm text-muted-foreground">{`${alert.condition === 'above' ? 'Price above' : 'Price below'} $${Number(alert.target_price).toFixed(2)}`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            alert.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {alert.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {!alert.is_active && (
                          <button
                            onClick={() => handleReactivate(alert.id)}
                            className="px-3 py-1 bg-accent text-accent-foreground rounded hover:bg-accent/90 text-xs font-medium"
                          >
                            Reactivate
                          </button>
                        )}
                        <button onClick={() => handleDelete(alert.id)} className="p-2 text-destructive hover:bg-destructive/20 rounded transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="mt-6">
              <Card className="bg-card border border-border/50 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell size={20} className="text-accent" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loadingNotifications && <p className="text-sm text-muted-foreground">Loading...</p>}
                    {!loadingNotifications && notifications.length === 0 && (
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    )}
                    {notifications.map((note) => (
                      <div key={note.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="text-sm">{note.message}</p>
                          <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!note.read && (
                            <button onClick={() => markNotificationRead(note.id)} className="px-3 py-1 bg-accent text-accent-foreground rounded">Mark read</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <NewAlertModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
