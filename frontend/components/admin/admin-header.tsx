"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

interface AdminHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function AdminHeader({ sidebarOpen, setSidebarOpen }: AdminHeaderProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)

  const handleAdminLogout = async () => {
    setIsLogoutLoading(true)
    // Clear admin session
    localStorage.removeItem("adminSession")
    // Redirect to admin login
    router.push("/admin/login")
  }

  return (
    <header className="bg-card border-b border-border/50 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Center: Admin Title */}
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold text-foreground">Admin Dashboard</h2>
        </div>

        {/* Right: Theme Toggle & Logout */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleAdminLogout}
            disabled={isLogoutLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            {isLogoutLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  )
}
