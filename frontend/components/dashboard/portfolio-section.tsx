"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Plus, Send } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { getThemeColors } from "@/components/theme-aware-colors"

const portfolioData = [
  { name: "Bitcoin", value: 45000, percentage: 45 },
  { name: "Ethereum", value: 25000, percentage: 25 },
  { name: "Solana", value: 15000, percentage: 15 },
  { name: "Others", value: 15000, percentage: 15 },
]

const COLORS = ["#FFA500", "#00FF00", "#9333EA", "#14B8A6"]

const Holdings = [
  { symbol: "BTC", amount: 1.25, value: 56537.5, change: 2.45 },
  { symbol: "ETH", amount: 10.5, value: 25733.4, change: 1.82 },
  { symbol: "SOL", amount: 125.3, value: 24481.9, change: 3.21 },
]

const performanceData = [
  { time: "Jan", value: 85000, invested: 80000 },
  { time: "Feb", value: 92000, invested: 85000 },
  { time: "Mar", value: 98000, invested: 90000 },
  { time: "Apr", value: 105000, invested: 95000 },
  { time: "May", value: 115000, invested: 100000 },
  { time: "Jun", value: 125000, invested: 100000 },
]

export default function PortfolioSection() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const colors = getThemeColors(isDark)
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0)
  const portfolioChange = 2.15
  const invested = 100000
  const profit = totalValue - invested

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm">
            <Plus size={18} /> Add Funds
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm">
            <Send size={18} /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-accent/20 via-card to-card border border-accent/30 rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">${(totalValue / 1000).toFixed(1)}K</p>
            <p className="text-sm text-success font-semibold mt-3 flex items-center gap-1">
              <TrendingUp size={16} /> +${((totalValue * portfolioChange) / 100).toFixed(0)} (
              {portfolioChange.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">${(invested / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground mt-3">Initial capital</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/20 via-card to-card border border-success/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-success">${(profit / 1000).toFixed(1)}K</p>
            <p className="text-xs text-success mt-3">{((profit / invested) * 100).toFixed(2)}% Return</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">${((totalValue * 0.15) / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground mt-3">Ready to trade</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} />
                <XAxis dataKey="time" stroke={colors.axisStroke} />
                <YAxis stroke={colors.axisStroke} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.lineStroke}
                  strokeWidth={3}
                  name="Portfolio Value"
                  dot={{ fill: colors.lineStroke, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke={colors.dashedLineStroke}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Invested Amount"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Asset Allocation */}
        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                      color: colors.tooltipText,
                    }}
                    formatter={(value: any) => `$${(value / 1000).toFixed(1)}K`}
                    labelStyle={{ color: colors.lineStroke }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${(item.value / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Asset</th>
                  <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Amount</th>
                  <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Value</th>
                  <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Change 24h</th>
                  <th className="text-center py-4 px-4 text-muted-foreground font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {Holdings.map((holding) => (
                  <tr
                    key={holding.symbol}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold text-foreground">{holding.symbol}</td>
                    <td className="text-right py-4 px-4 text-muted-foreground">{holding.amount.toFixed(4)}</td>
                    <td className="text-right py-4 px-4 font-semibold text-foreground">${holding.value.toFixed(2)}</td>
                    <td
                      className={`text-right py-4 px-4 font-semibold ${holding.change >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {holding.change >= 0 ? "↑" : "↓"} {Math.abs(holding.change).toFixed(2)}%
                    </td>
                    <td className="text-center py-4 px-4">
                      <button className="px-3 py-1 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors">
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
  )
}
