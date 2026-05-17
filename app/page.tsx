'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPct, pnlColor } from '@/lib/utils'
import { InventoryItem, Sale } from '@/lib/types'

interface Stats {
  inventoryCount: number
  totalCostBasis: number
  totalCurrentValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  salesCount: number
  totalRevenue: number
  totalNetProceeds: number
  realizedProfit: number
  buyerCount: number
  topSets: InventoryItem[]
  recentSales: Sale[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [invRes, salesRes, buyersRes, allSalesRes] = await Promise.all([
        supabase.from('inventory_with_pnl').select('*'),
        supabase.from('sales_with_pnl').select('*').order('sale_date', { ascending: false }).limit(5),
        supabase.from('buyers').select('id'),
        supabase.from('sales_with_pnl').select('*'),
      ])

      const inventory = (invRes.data as InventoryItem[]) ?? []
      const recentSales = (salesRes.data as Sale[]) ?? []
      const allSales = (allSalesRes.data as Sale[]) ?? []

      const totalCostBasis = inventory.reduce((s, i) => s + (i.purchase_price ?? 0) * i.quantity, 0)
      const totalCurrentValue = inventory.reduce((s, i) => s + (i.current_value ?? i.purchase_price ?? 0) * i.quantity, 0)
      const unrealizedPnl = totalCurrentValue - totalCostBasis
      const unrealizedPnlPct = totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0

      const totalRevenue = allSales.reduce((s, sale) => s + sale.sale_price, 0)
      const totalNetProceeds = allSales.reduce((s, sale) => s + (sale.net_proceeds ?? 0), 0)
      const totalSalesCost = allSales.reduce((s, sale) => s + (sale.purchase_price ?? 0), 0)
      const realizedProfit = totalNetProceeds - totalSalesCost

      const topSets = [...inventory]
        .filter(i => i.unrealized_pnl_pct != null)
        .sort((a, b) => (b.unrealized_pnl_pct ?? 0) - (a.unrealized_pnl_pct ?? 0))
        .slice(0, 5)

      setStats({
        inventoryCount: inventory.length,
        totalCostBasis,
        totalCurrentValue,
        unrealizedPnl,
        unrealizedPnlPct,
        salesCount: allSales.length,
        totalRevenue,
        totalNetProceeds,
        realizedProfit,
        buyerCount: (buyersRes.data ?? []).length,
        topSets,
        recentSales,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-slate-500 text-sm">Loading dashboard…</p>
  if (!stats) return null

  const kpis = [
    { label: 'Sets in Inventory', value: stats.inventoryCount.toString(), sub: undefined, href: '/inventory', color: 'text-blue-400' },
    { label: 'Portfolio Value', value: formatCurrency(stats.totalCurrentValue), sub: `Cost basis ${formatCurrency(stats.totalCostBasis)}`, href: '/inventory', color: 'text-yellow-400' },
    { label: 'Unrealized P&L', value: formatCurrency(stats.unrealizedPnl), sub: formatPct(stats.unrealizedPnlPct), href: '/inventory', color: pnlColor(stats.unrealizedPnl) },
    { label: 'Realized Profit', value: formatCurrency(stats.realizedProfit), sub: `${stats.salesCount} sales · ${formatCurrency(stats.totalRevenue)} revenue`, href: '/sales', color: pnlColor(stats.realizedProfit) },
    { label: 'Buyers', value: stats.buyerCount.toString(), sub: undefined, href: '/buyers', color: 'text-purple-400' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Your LEGO portfolio at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col gap-2 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
              <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-slate-500">{kpi.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Top Performing Sets</h2>
            <Link href="/inventory" className="text-xs text-yellow-400 hover:underline">View all →</Link>
          </div>
          {stats.topSets.length === 0 ? (
            <p className="text-slate-500 text-sm">Add inventory and refresh prices to see performance.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.topSets.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-100">{item.set_name ?? item.set_number}</span>
                    <span className="text-slate-500 text-xs ml-2">{item.set_number}</span>
                  </div>
                  <span className={`font-semibold ${pnlColor(item.unrealized_pnl_pct)}`}>
                    {formatPct(item.unrealized_pnl_pct)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">Recent Sales</h2>
            <Link href="/sales" className="text-xs text-yellow-400 hover:underline">View all →</Link>
          </div>
          {stats.recentSales.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales yet. Log your first sale.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-100">{sale.set_name ?? sale.set_number ?? '—'}</span>
                    <span className="text-slate-500 text-xs ml-2">{sale.platform}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-200">{formatCurrency(sale.sale_price)}</div>
                    <div className={`text-xs ${pnlColor(sale.realized_pnl_pct)}`}>{formatPct(sale.realized_pnl_pct)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.inventoryCount === 0 && (
        <div className="border border-yellow-400/20 bg-yellow-400/5 rounded-xl p-6 text-center">
          <p className="text-yellow-400 font-semibold mb-1">Get started</p>
          <p className="text-slate-400 text-sm mb-4">Add your first LEGO set to start tracking your portfolio value.</p>
          <Link href="/inventory" className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-300 transition-colors">
            <Package size={15} /> Go to Inventory
          </Link>
        </div>
      )}
    </div>
  )
}
