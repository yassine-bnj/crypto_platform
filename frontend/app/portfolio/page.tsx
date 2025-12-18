"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/sidebar"
import PortfolioSection from "@/components/dashboard/portfolio-section"
import { Plus, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Portfolio Management</h1>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium">
                <Plus size={18} /> Add Funds
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                <Send size={18} /> Withdraw
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border/50">
            {["overview", "transactions", "reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab
                    ? "text-accent border-accent"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === "overview" && <PortfolioSection />}

            {activeTab === "transactions" && (
              <div className="space-y-6">
                <Card className="bg-card border border-border/50 rounded-xl">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Date</th>
                            <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Type</th>
                            <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Asset</th>
                            <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Amount</th>
                            <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Price</th>
                            <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              date: "Dec 10, 2024",
                              type: "Buy",
                              asset: "BTC",
                              amount: 0.5,
                              price: 42500,
                              total: 21250,
                            },
                            {
                              date: "Dec 09, 2024",
                              type: "Sell",
                              asset: "ETH",
                              amount: 5,
                              price: 2450,
                              total: 12250,
                            },
                            {
                              date: "Dec 08, 2024",
                              type: "Buy",
                              asset: "SOL",
                              amount: 100,
                              price: 195,
                              total: 19500,
                            },
                          ].map((tx, idx) => (
                            <tr key={idx} className="border-b border-border/30 hover:bg-secondary/30">
                              <td className="py-4 px-4 text-muted-foreground">{tx.date}</td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-3 py-1 rounded text-xs font-semibold ${
                                    tx.type === "Buy"
                                      ? "bg-success/20 text-success"
                                      : "bg-destructive/20 text-destructive"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-semibold">{tx.asset}</td>
                              <td className="text-right py-4 px-4">{tx.amount}</td>
                              <td className="text-right py-4 px-4 text-muted-foreground">${tx.price}</td>
                              <td className="text-right py-4 px-4 font-semibold text-foreground">${tx.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <Card className="bg-card border border-border/50 rounded-xl">
                  <CardHeader>
                    <CardTitle>Portfolio Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Reports coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
