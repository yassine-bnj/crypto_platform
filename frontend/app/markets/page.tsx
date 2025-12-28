"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getAssetPrice, getAssets, placeVirtualTrade, AssetItem } from "@/lib/api-service"

export default function MarketsPage() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [tradeOpen, setTradeOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; name: string } | null>(null)
  const [tradeForm, setTradeForm] = useState({ side: "buy", quantity: "" })
  const [submittingTrade, setSubmittingTrade] = useState(false)
  const [tradeAmount, setTradeAmount] = useState<number | null>(null)
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({})

  const totalPages = Math.max(1, Math.ceil(assets.length / pageSize))
  const currentAssets = assets.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const data = await getAssets()
        setAssets(data)
      } catch (error: any) {
        toast({ title: "Unable to load assets", description: error?.message ?? "Unknown error", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [toast])

  const openTrade = (symbol: string, name: string) => {
    setSelectedAsset({ symbol, name })
    setTradeForm({ side: "buy", quantity: "" })
    setTradeAmount(null)
    setTradeOpen(true)
  }

  useEffect(() => {
    const quantity = Number.parseFloat(tradeForm.quantity)
    if (!selectedAsset || Number.isNaN(quantity) || quantity <= 0) {
      setTradeAmount(null)
      return
    }

    const livePrice = assetPrices[selectedAsset.symbol]
    if (livePrice) {
      setTradeAmount(quantity * livePrice)
    } else {
      setTradeAmount(null)
    }
  }, [tradeForm.quantity, tradeForm.side, selectedAsset, assetPrices])

  useEffect(() => {
    const symbol = selectedAsset?.symbol
    if (!symbol) return
    if (assetPrices[symbol]) return

    getAssetPrice(symbol)
      .then((data) => {
        if (typeof data?.price === "number") {
          setAssetPrices((prev) => ({ ...prev, [symbol]: data.price }))
        }
      })
      .catch((error: any) => {
        toast({ title: "Price unavailable", description: error?.message ?? "Could not fetch price", variant: "destructive" })
      })
  }, [selectedAsset, assetPrices, toast])

  const handleTrade = async () => {
    if (!selectedAsset) return
    if (!tradeForm.quantity) {
      toast({ title: "Quantity required", variant: "destructive" })
      return
    }

    setSubmittingTrade(true)
    try {
      const quantity = Number.parseFloat(tradeForm.quantity)
      await placeVirtualTrade({ symbol: selectedAsset.symbol, side: tradeForm.side as "buy" | "sell", quantity })
      toast({ title: "Simulated trade executed" })
      setTradeOpen(false)
    } catch (error: any) {
      toast({ title: "Trade failed", description: error?.message ?? "Unable to execute simulation", variant: "destructive" })
    } finally {
      setSubmittingTrade(false)
    }
  }

  useEffect(() => {
    // Fetch prices for currently visible page if not cached
    const symbolsToFetch = currentAssets
      .map((a) => a.symbol)
      .filter((sym) => !assetPrices[sym])

    if (symbolsToFetch.length === 0) return

    Promise.all(
      symbolsToFetch.map((sym) =>
        getAssetPrice(sym)
          .then((data) => ({ sym, price: data?.price }))
          .catch(() => ({ sym, price: undefined }))
      )
    ).then((results) => {
      setAssetPrices((prev) => {
        const next = { ...prev }
        results.forEach(({ sym, price }) => {
          if (typeof price === "number") next[sym] = price
        })
        return next
      })
    })
  }, [currentAssets, assetPrices])

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
                <CardTitle>All Cryptocurrencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Symbol</th>
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Name</th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Latest price (USD)</th>
                        <th className="text-center py-4 px-4 text-muted-foreground font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="py-6 px-4 text-center text-muted-foreground">Loading assets...</td>
                        </tr>
                      ) : currentAssets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 px-4 text-center text-muted-foreground">No assets found.</td>
                        </tr>
                      ) : (
                        currentAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4 font-semibold text-accent">{asset.symbol}</td>
                          <td className="py-4 px-4">{asset.name}</td>
                          <td className="text-right py-4 px-4 font-semibold">
                            {assetPrices[asset.symbol] ? `$${assetPrices[asset.symbol].toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="text-center py-4 px-4">
                            <button
                              className="px-4 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
                              onClick={() => openTrade(asset.symbol, asset.name)}
                            >
                              Trade
                            </button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {page} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Simulate a trade</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedAsset ? `${selectedAsset.symbol} — ${selectedAsset.name}` : "Select an asset"}
            </p>
          </DialogHeader>

          <div className="space-y-3">
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
              />
            </div>

            {tradeAmount !== null && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {tradeForm.side === "buy" ? "You will pay" : "You will receive"}
                </span>
                <span className={`text-lg font-bold ${tradeForm.side === "buy" ? "text-destructive" : "text-success"}`}>
                  ${tradeAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setTradeOpen(false)} disabled={submittingTrade}>
              Cancel
            </Button>
            <Button onClick={handleTrade} disabled={submittingTrade || !selectedAsset}>
              {submittingTrade ? "Executing..." : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
