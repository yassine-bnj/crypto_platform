"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Sidebar from "@/components/dashboard/sidebar"
import { User, Shield, Bell, Zap, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    bio: "",
  })

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        bio: "",
      })
    }
  }, [user])

  const [isEditing, setIsEditing] = useState(false)

  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile({ full_name: userData.name, phone: userData.phone, country: userData.country })
      setIsEditing(false)
      toast({ title: 'Profile updated', description: 'Your profile was saved successfully.' })
    } catch (err: any) {
      console.error(err)
      const message = err?.message || 'Failed to update profile'
      toast({ title: 'Update failed', description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="bg-card border border-border/50 rounded-xl lg:col-span-1">
                <CardContent className="pt-8">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <User size={40} className="text-accent-foreground" />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors">
                        <Camera size={16} />
                      </button>
                    </div>
                    <h2 className="text-xl font-bold text-center mb-1">{userData.name}</h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">{userData.email}</p>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                    >
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Settings Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card className="bg-card border border-border/50 rounded-xl">
                  <CardHeader className="flex items-center gap-2">
                    <User size={20} className="text-accent" />
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Full Name</label>
                        <input
                          type="text"
                          value={userData.name}
                          disabled={!isEditing}
                          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Phone</label>
                        <input
                          type="tel"
                          value={userData.phone}
                          disabled={!isEditing}
                          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-semibold">Email</label>
                          <input
                            type="email"
                            value={userData.email}
                            disabled
                            readOnly
                            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-semibold">Country</label>
                        <input
                          type="text"
                          value={userData.country}
                          disabled={!isEditing}
                          onChange={(e) => setUserData({ ...userData, country: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-card border border-border/50 rounded-xl">
                  <CardHeader className="flex items-center gap-2">
                    <Shield size={20} className="text-accent" />
                    <CardTitle>Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      href="/profile/edit-password"
                      className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={18} />
                        <div className="text-left">
                          <p className="font-semibold text-sm">Change Password</p>
                          <p className="text-xs text-muted-foreground">Update your password regularly</p>
                        </div>
                      </div>
                      <span className="text-muted-foreground">→</span>
                    </Link>
                    <button className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <Zap size={18} />
                        <div className="text-left">
                          <p className="font-semibold text-sm">Two-Factor Authentication</p>
                          <p className="text-xs text-muted-foreground">Enhance your account security</p>
                        </div>
                      </div>
                      <span className="text-accent font-semibold">Enabled</span>
                    </button>
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
                      { label: "Price Alerts", desc: "Get notified on price changes" },
                      { label: "Portfolio Updates", desc: "Notifications on portfolio changes" },
                      { label: "Email Digest", desc: "Weekly market summary emails" },
                    ].map((notif) => (
                      <label
                        key={notif.label}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                        <div>
                          <p className="font-semibold text-sm">{notif.label}</p>
                          <p className="text-xs text-muted-foreground">{notif.desc}</p>
                        </div>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
