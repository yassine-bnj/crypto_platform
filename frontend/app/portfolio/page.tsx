"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar"
import PortfolioSection from "@/components/dashboard/portfolio-section"

export default function PortfolioPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold">Virtual Portfolio</h1>
          <p className="text-muted-foreground mt-1">Paper-trade crypto pairs, track hypothetical P&L, and iterate safely.</p>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <PortfolioSection />
          </div>
        </div>
      </div>
    </div>
  )
}
