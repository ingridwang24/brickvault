'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Buyer, Sale, InventoryItem } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface Props {
  buyer: Buyer
}

export default function BuyerDetail({ buyer }: Props) {
  const [sales, setSales] = useState<Sale[]>([])
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Past sales for this buyer
      const { data: buyerSales } = await supabase
        .from('sales_with_pnl')
        .select('*')
        .eq('buyer_id', buyer.id)
        .order('sale_date', { ascending: false })
      const salesData = (buyerSales as Sale[]) ?? []
      setSales(salesData)

      // Derive themes and price range
      // We need inventory records to get theme info
      const inventoryIds = salesData.map(s => s.inventory_id).filter(Boolean) as string[]
      let themes: string[] = []
      let prices: number[] = salesData.map(s => s.sale_price)
      if (inventoryIds.length) {
        const { data: invData } = await supabase
          .from('inventory')
          .select('theme')
          .in('id', inventoryIds)
        themes = [...new Set((invData ?? []).map((i: { theme: string | null }) => i.theme).filter(Boolean) as string[])]
      }

      // Suggest from holding inventory: match theme OR price range
      const minPrice = prices.length ? Math.min(...prices) * 0.7 : 0
      const maxPrice = prices.length ? Math.max(...prices) * 1.3 : Infinity

      const { data: holdingInv } = await supabase
        .from('inventory_with_pnl')
        .select('*')
        .eq('status', 'Holding')

      const allHolding = (holdingInv as InventoryItem[]) ?? []
      const matched = allHolding.filter(item => {
        const themeMatch = themes.length > 0 && item.theme && themes.includes(item.theme)
        const price = item.current_value ?? item.purchase_price ?? 0
        const priceMatch = prices.length > 0 && price >= minPrice && price <= maxPrice
        return themeMatch || priceMatch
      })
      setSuggestions(matched)
      setLoading(false)
    }
    load()
  }, [buyer.id])

  const totalSpend = sales.reduce((s, sale) => s + sale.sale_price, 0)
  const avgSpend = sales.length ? totalSpend / sales.length : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Contact info */}
      <div className="flex flex-wrap gap-3 text-sm">
        {buyer.email && <span className="text-slate-400">✉ <span className="text-slate-200">{buyer.email}</span></span>}
        {buyer.ebay_handle && <span className="text-slate-400">eBay: <span className="text-slate-200">{buyer.ebay_handle}</span></span>}
        {buyer.other_contact && <span className="text-slate-400">Other: <span className="text-slate-200">{buyer.other_contact}</span></span>}
      </div>
      {buyer.platforms?.length && (
        <div className="flex gap-1.5 flex-wrap">
          {buyer.platforms.map(p => <Badge key={p} variant="info">{p}</Badge>)}
        </div>
      )}
      {buyer.notes && <p className="text-sm text-slate-400 italic">{buyer.notes}</p>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Purchases', value: sales.length },
          { label: 'Total Spend', value: formatCurrency(totalSpend) },
          { label: 'Avg per Sale', value: formatCurrency(avgSpend) },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-lg font-bold text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Purchase history */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Purchase History</h3>
        {loading ? <p className="text-slate-500 text-xs">Loading…</p> : sales.length === 0 ? (
          <p className="text-slate-500 text-xs">No sales linked yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="text-slate-100">{sale.set_name ?? sale.set_number ?? '—'}</span>
                  <span className="text-slate-500 text-xs ml-2">{formatDate(sale.sale_date)} · {sale.platform}</span>
                </div>
                <span className="text-slate-200 font-medium">{formatCurrency(sale.sale_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          Suggested from Your Inventory
          <span className="ml-1.5 text-xs text-slate-500 font-normal">(matching theme & price)</span>
        </h3>
        {loading ? <p className="text-slate-500 text-xs">Loading…</p> : suggestions.length === 0 ? (
          <p className="text-slate-500 text-xs">No inventory matches yet for this buyer's profile.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {suggestions.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="text-slate-100">{item.set_name ?? item.set_number}</span>
                  <span className="text-slate-500 text-xs ml-2">{item.theme} · {item.set_number}</span>
                </div>
                <span className="text-emerald-400 font-medium">{formatCurrency(item.current_value ?? item.purchase_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
