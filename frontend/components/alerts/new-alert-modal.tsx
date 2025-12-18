"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface NewAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CRYPTOCURRENCIES = [
  { id: "BTC", name: "Bitcoin (BTC)" },
  { id: "ETH", name: "Ethereum (ETH)" },
  { id: "SOL", name: "Solana (SOL)" },
  { id: "ADA", name: "Cardano (ADA)" },
  { id: "XRP", name: "Ripple (XRP)" },
  { id: "DOGE", name: "Dogecoin (DOGE)" },
  { id: "MATIC", name: "Polygon (MATIC)" },
  { id: "LINK", name: "Chainlink (LINK)" },
  { id: "ARB", name: "Arbitrum (ARB)" },
  { id: "OP", name: "Optimism (OP)" },
]

export default function NewAlertModal({ open, onOpenChange }: NewAlertModalProps) {
  const [formData, setFormData] = useState({
    currency: "BTC",
    price: "",
    condition: "above",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Alert created:", formData)
    // Reset form and close modal
    setFormData({ currency: "BTC", price: "", condition: "above" })
    onOpenChange(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Price Alert</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Cryptocurrency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            >
              {CRYPTOCURRENCIES.map((crypto) => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price (USD)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Enter target price"
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <div className="flex gap-3">
              <label
                className="flex items-center gap-2 flex-1 p-3 bg-secondary/50 border-2 border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
                style={{ borderColor: formData.condition === "above" ? "var(--color-accent)" : "var(--color-border)" }}
              >
                <input
                  type="radio"
                  name="condition"
                  value="above"
                  checked={formData.condition === "above"}
                  onChange={handleInputChange}
                  className="accent-accent"
                />
                <span className="font-medium">Price Above</span>
              </label>
              <label
                className="flex items-center gap-2 flex-1 p-3 bg-secondary/50 border-2 border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
                style={{ borderColor: formData.condition === "below" ? "var(--color-accent)" : "var(--color-border)" }}
              >
                <input
                  type="radio"
                  name="condition"
                  value="below"
                  checked={formData.condition === "below"}
                  onChange={handleInputChange}
                  className="accent-accent"
                />
                <span className="font-medium">Price Below</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Create Alert
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
