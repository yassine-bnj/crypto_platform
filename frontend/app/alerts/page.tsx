"use client"

import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import NewAlertModal from "@/components/alerts/new-alert-modal"

export default function AlertsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const alerts = [
    { id: 1, asset: "BTC", condition: "Price above $45,000", status: "active" },
    { id: 2, asset: "ETH", condition: "Price below $2,000", status: "active" },
    { id: 3, asset: "SOL", condition: "Volume above 3B", status: "inactive" },
  ]

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
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{alert.asset}</p>
                        <p className="text-sm text-muted-foreground">{alert.condition}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            alert.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                        <button className="p-2 text-destructive hover:bg-destructive/20 rounded transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewAlertModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
