"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TrendingUp, Plus, Send, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AssetItem,
  VirtualPortfolioSummary,
  VirtualTrade,
  VirtualFundingTransaction,
  fundVirtualPortfolio,
  getAssets,
  getAssetPrice,
  getVirtualPortfolio,
  listVirtualTrades,
  listVirtualFundingHistory,
  placeVirtualTrade,
} from "@/lib/api-service"

const formatCurrency = (value: number | undefined) =>
  (value ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

const formatPercent = (value: number | undefined) => `${((value ?? 0) * 1).toFixed(2)}%`

export default function PortfolioSection() {
  const { toast } = useToast()
  const [portfolio, setPortfolio] = useState<VirtualPortfolioSummary | null>(null)
  const [trades, setTrades] = useState<VirtualTrade[]>([])
  const [fundingHistory, setFundingHistory] = useState<VirtualFundingTransaction[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fundAmount, setFundAmount] = useState("1000")
  const [tradeForm, setTradeForm] = useState({ symbol: "", side: "buy", quantity: "" })
  const [submittingTrade, setSubmittingTrade] = useState(false)
  const [funding, setFunding] = useState(false)
  const [tradeAmount, setTradeAmount] = useState<number | null>(null)
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({})

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [portfolioData, tradeData, fundingData, assetData] = await Promise.all([
        getVirtualPortfolio(),
        listVirtualTrades(),
        listVirtualFundingHistory(),
        getAssets(),
      ])
      setPortfolio(portfolioData)
      setTrades(tradeData)
      setFundingHistory(fundingData)
      setAssets(assetData)
      if (!tradeForm.symbol && assetData.length > 0) {
        setTradeForm((prev) => ({ ...prev, symbol: assetData[0].symbol }))
      }
    } catch (error: any) {
      toast({ title: "Unable to load virtual portfolio", description: error?.message ?? "Unknown error", variant: "destructive" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const equityColor = useMemo(() => (portfolio && portfolio.pnl >= 0 ? "text-success" : "text-destructive"), [
    portfolio,
  ])

  // Calculate trade amount in real-time
  useEffect(() => {
    const quantity = Number.parseFloat(tradeForm.quantity)

    if (!isNaN(quantity) && quantity > 0) {
      // Find the current price from portfolio holdings or fetched prices
      const currentAsset = portfolio?.holdings.find((h) => h.symbol === tradeForm.symbol)
      const livePrice = currentAsset?.latest_price ?? assetPrices[tradeForm.symbol]
      if (livePrice) {
        setTradeAmount(quantity * livePrice)
      } else {
        setTradeAmount(null)
      }
    } else {
      setTradeAmount(null)
    }
  }, [tradeForm.symbol, tradeForm.side, tradeForm.quantity, portfolio, assetPrices])

  // Fetch latest price when asset changes and not already known
  useEffect(() => {
    const symbol = tradeForm.symbol
    if (!symbol) return

    const holdingPrice = portfolio?.holdings.find((h) => h.symbol === symbol)?.latest_price
    if (holdingPrice || assetPrices[symbol]) return

    getAssetPrice(symbol)
      .then((data) => {
        if (typeof data?.price === "number") {
          setAssetPrices((prev) => ({ ...prev, [symbol]: data.price }))
        }
      })
      .catch((error: any) => {
        toast({ title: "Price unavailable", description: error?.message ?? "Could not fetch price", variant: "destructive" })
      })
  }, [tradeForm.symbol, portfolio, assetPrices, toast])

  const handleTradeSubmit = async () => {
    if (!tradeForm.symbol || !tradeForm.quantity) {
      toast({ title: "Symbol and quantity required", variant: "destructive" })
      return
    }

    setSubmittingTrade(true)
    try {
      const quantity = Number.parseFloat(tradeForm.quantity)
      const result = await placeVirtualTrade({
        symbol: tradeForm.symbol,
        side: tradeForm.side as "buy" | "sell",
        quantity,
      })
      setPortfolio(result.portfolio)
      setTrades((prev) => [result.trade, ...prev])
      setFundingHistory((prev) => prev) // Keep existing, reload on next refresh
      toast({ title: "Simulated trade executed" })
      setTradeForm((prev) => ({ ...prev, quantity: "" }))
    } catch (error: any) {
      toast({ title: "Trade failed", description: error?.message ?? "Unable to place trade", variant: "destructive" })
    } finally {
      setSubmittingTrade(false)
    }
  }

  const handleFunding = async (direction: "deposit" | "withdraw") => {
    if (!fundAmount) return
    setFunding(true)
    try {
      const amount = Number.parseFloat(fundAmount)
      const result = await fundVirtualPortfolio({ amount, direction })
      setPortfolio(result.portfolio)
      toast({ title: direction === "deposit" ? "Funds added" : "Withdrawal simulated" })
      // Reload funding history
      const newHistory = await listVirtualFundingHistory()
      setFundingHistory(newHistory)
    } catch (error: any) {
      toast({ title: "Funding failed", description: error?.message ?? "Unable to update balance", variant: "destructive" })
    } finally {
      setFunding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle>Loading portfolio...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Fetching your virtual holdings and trades.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Virtual portfolio mode</p>
          <h2 className="text-2xl font-bold">Paper trading dashboard</h2>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-accent/20 via-card to-card border border-accent/30 rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total equity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(portfolio?.equity)}</p>
            <p className={`text-sm mt-3 flex items-center gap-1 font-semibold ${equityColor}`}>
              <TrendingUp size={16} /> {formatCurrency(portfolio?.pnl)} ({formatPercent(portfolio?.pnl_pct)})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cash (virtual)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(portfolio?.cash_balance)}</p>
            <p className="text-xs text-muted-foreground mt-3">Starting cash: {formatCurrency(portfolio?.initial_balance)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 via-card to-card border border-success/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Invested value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(portfolio?.holdings_value)}</p>
            <p className="text-xs text-muted-foreground mt-3">Realized P&L: {formatCurrency(portfolio?.realized_pnl)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Funding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-input"
                min={0}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleFunding("deposit")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-semibold"
                disabled={funding}
              >
                <Plus size={16} /> Add
              </button>
              <button
                onClick={() => handleFunding("withdraw")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-semibold"
                disabled={funding}
              >
                <Send size={16} /> Withdraw
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolio && portfolio.holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Asset</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Quantity</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Avg price</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Market value</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-semibold">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((holding) => (
                      <tr key={holding.symbol} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-semibold">{holding.symbol}</td>
                        <td className="text-right py-3 px-4 text-muted-foreground">{Number(holding.quantity).toFixed(6)}</td>
                        <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(holding.avg_price)}</td>
                        <td className="text-right py-3 px-4 font-semibold">{formatCurrency(holding.market_value)}</td>
                        <td
                          className={`text-right py-3 px-4 font-semibold ${holding.pnl_abs >= 0 ? "text-success" : "text-destructive"}`}
                        >
                          {formatCurrency(holding.pnl_abs)} ({formatPercent(holding.pnl_pct)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No holdings yet. Place a simulated trade to start.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Simulate a trade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-sm text-muted-foreground" htmlFor="asset-select">Asset</label>
            <select
              id="asset-select"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
              value={tradeForm.symbol}
              onChange={(e) => setTradeForm((prev) => ({ ...prev, symbol: e.target.value }))}
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.symbol}>
                  {asset.symbol} — {asset.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground" htmlFor="side">Side</label>
                <select
                  id="side"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                  value={tradeForm.side}
                  onChange={(e) => setTradeForm((prev) => ({ ...prev, side: e.target.value }))}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground" htmlFor="quantity">Quantity</label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="bg-input"
                />
              </div>
            </div>

            {tradeAmount !== null && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {tradeForm.side === "buy" ? "You will pay:" : "You will receive:"}
                  </span>
                  <span className={`text-lg font-bold ${tradeForm.side === "buy" ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(tradeAmount)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleTradeSubmit}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
              disabled={submittingTrade}
            >
              {submittingTrade ? "Placing trade..." : "Execute simulation"}
            </button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
        <CardHeader>
          <CardTitle>Recent virtual trades</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Side</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Asset</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Qty</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Price</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            tx.side === "buy" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {tx.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{tx.symbol}</td>
                      <td className="text-right py-3 px-4">{Number(tx.quantity).toFixed(6)}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(tx.price_usd)}</td>
                      <td className="text-right py-3 px-4 font-semibold">{formatCurrency(tx.total_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No simulated trades yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card via-card to-card border border-border/50 rounded-xl">
        <CardHeader>
          <CardTitle>Funding history</CardTitle>
        </CardHeader>
        <CardContent>
          {fundingHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Type</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fundingHistory.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            tx.direction === "deposit" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {tx.direction === "deposit" ? "DEPOSIT" : "WITHDRAW"}
                        </span>
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${tx.direction === "deposit" ? "text-success" : "text-destructive"}`}>
                        {tx.direction === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No funding history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

