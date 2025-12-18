"use client"

import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function MarketsPage() {
  const markets = [
    { symbol: "BTC", name: "Bitcoin", price: 42567.89, change: 2.45, volume: "28.5B" },
    { symbol: "ETH", name: "Ethereum", price: 2450.23, change: 1.82, volume: "15.2B" },
    { symbol: "SOL", name: "Solana", price: 195.67, change: 3.21, volume: "2.8B" },
    { symbol: "XRP", name: "Ripple", price: 2.45, change: -1.23, volume: "1.9B" },
    { symbol: "ADA", name: "Cardano", price: 1.05, change: 0.45, volume: "0.9B" },
    { symbol: "DOGE", name: "Dogecoin", price: 0.38, change: 2.15, volume: "1.2B" },
  ]

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-muted-foreground mt-1">Real-time cryptocurrency prices</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Card className="bg-card border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle>Top Cryptocurrencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Symbol</th>
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Name</th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Price</th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-semibold">24h Change</th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Volume</th>
                        <th className="text-center py-4 px-4 text-muted-foreground font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markets.map((market) => (
                        <tr
                          key={market.symbol}
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4 font-semibold text-accent">{market.symbol}</td>
                          <td className="py-4 px-4">{market.name}</td>
                          <td className="text-right py-4 px-4 font-semibold">${market.price.toLocaleString()}</td>
                          <td
                            className={`text-right py-4 px-4 font-semibold flex items-center justify-end gap-1 ${market.change >= 0 ? "text-success" : "text-destructive"}`}
                          >
                            {market.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {Math.abs(market.change).toFixed(2)}%
                          </td>
                          <td className="text-right py-4 px-4 text-muted-foreground">{market.volume}</td>
                          <td className="text-center py-4 px-4">
                            <button className="px-4 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors">
                              Trade
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
