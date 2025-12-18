"use client"

import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Bell, Lock } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl">
            <div className="space-y-6">
              {/* Display */}
              <Card className="bg-card border border-border/50 rounded-xl">
                <CardHeader className="flex items-center gap-2">
                  <Palette size={20} className="text-accent" />
                  <CardTitle>Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-semibold">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Always enabled for this app</p>
                    </div>
                    <div className="w-12 h-6 bg-accent rounded-full"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="bg-card border border-border/50 rounded-xl">
                <CardHeader className="flex items-center gap-2">
                  <Bell size={20} className="text-accent" />
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Email Notifications", enabled: true },
                    { label: "Browser Notifications", enabled: false },
                    { label: "Push Notifications", enabled: true },
                  ].map((notif) => (
                    <label
                      key={notif.label}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                    >
                      <span className="font-semibold">{notif.label}</span>
                      <input type="checkbox" defaultChecked={notif.enabled} className="w-4 h-4 rounded" />
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-card border border-border/50 rounded-xl">
                <CardHeader className="flex items-center gap-2">
                  <Lock size={20} className="text-accent" />
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <button className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                    <div className="text-left">
                      <p className="font-semibold">Sessions</p>
                      <p className="text-sm text-muted-foreground">Manage active sessions</p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-destructive/10 border border-destructive/30 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <button className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors">
                    Delete Account
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
