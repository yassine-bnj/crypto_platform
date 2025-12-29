"use client"

import type React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth"
import { BarChart3, Wallet, Zap, Settings, Home, LogOut, User, Shield } from "lucide-react"

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
      {/* Logo */}
      <Link href="/" className="mb-8 block">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          CryptoTrack
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Trading Dashboard</p>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavItem href="/" icon={<Home size={20} />} label="Dashboard" active={isActive("/")} />
        <NavItem href="/portfolio" icon={<Wallet size={20} />} label="Portfolio" active={isActive("/portfolio")} />
        <NavItem href="/markets" icon={<BarChart3 size={20} />} label="Markets" active={isActive("/markets")} />
        <NavItem href="/alerts" icon={<Zap size={20} />} label="Alerts" active={isActive("/alerts")} />
        <NavItem href="/admin" icon={<Shield size={20} />} label="Admin Panel" active={isActive("/admin")} />
      </nav>

      {/* Settings and Profile */}
      <div className="pt-4 border-t border-sidebar-border space-y-2">
        <NavItem href="/profile" icon={<User size={20} />} label="Profile" active={isActive("/profile")} />
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
