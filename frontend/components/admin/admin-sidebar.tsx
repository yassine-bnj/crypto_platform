"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Settings, BarChart3, Server, LogOut, Shield, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/context/auth"

export default function AdminSidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
      {/* Logo */}
      <Link href="/admin" className="mb-8 block">
        <div className="flex items-center gap-2">
          <Shield className="text-primary" size={28} />
          <div>
            <h1 className="text-xl font-bold text-primary">CryptoTrack</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavItem
          href="/admin"
          icon={<BarChart3 size={20} />}
          label="Dashboard"
          active={isActive("/admin") && pathname === "/admin"}
        />
        <NavItem
          href="/admin/users"
          icon={<Users size={20} />}
          label="User Management"
          active={isActive("/admin/users")}
        />
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2 rounded-lg transition-colors flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Server size={20} />
          <span className="text-sm font-medium">Monitoring (Grafana)</span>
        </a>
        <NavItem
          href="/admin/api-config"
          icon={<Server size={20} />}
          label="API Settings"
          active={isActive("/admin/api-config")}
        />
        <NavItem
          href="/admin/system"
          icon={<Settings size={20} />}
          label="System Settings"
          active={isActive("/admin/system")}
        />
      </nav>

      <div className="pt-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Toggle dark/light mode"
        >
          {theme === "light" ? (
            <>
              <Moon size={20} />
              <span className="text-sm font-medium">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={20} />
              <span className="text-sm font-medium">Light Mode</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block w-full px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
