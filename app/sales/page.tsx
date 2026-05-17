'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Sale } from '@/lib/types'
import { formatCurrency, formatPct, formatDate, pnlColor } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LogSaleForm from '@/components/sales/LogSaleForm'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('sales_with_pnl')
      .select('*')
      .order('sale_date', { ascending: false })
    setSales((data as Sale[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteSale(id: string) {
    if (!confirm('Delete this sale?')) return
    const supabase = createClient()
    await supabase.from('sales').delete().eq('id', id)
    load()
  }

  const totalRevenue = sales.reduce((s, sale) => s + sale.sale_price, 0)
  const totalNet = sales.reduce((s, sale) => s + (sale.net_proceeds ?? 0), 0)
  const totalCost = sales.reduce((s, sale) => s + (sale.purchase_price ?? 0), 0)
  const totalProfit = totalNet - totalCost

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sales</h1>
          <p className="text-sm text-slate-400 mt-0.5">{sales.length} transactions · {formatCurrency(totalRevenue)} revenue · {formatCurrency(totalNet)} net · <span className={pnlColor(totalProfit)}>{formatCurrency(totalProfit)} profit</span></p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Log Sale
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-slate-100' },
          { label: 'Net Proceeds', value: formatCurrency(totalNet), color: 'text-slate-100' },
          { label: 'Total Cost Basis', value: formatCurrency(totalCost), color: 'text-slate-100' },
          { label: 'Realized Profit', value: formatCurrency(totalProfit), color: pnlColor(totalProfit) },
        ].map(kpi => (
          <div key={kpi.label} className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : sales.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No sales yet.</p>
          <p className="text-sm mt-1">Click "Log Sale" to record your first sale.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Set</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Platform</th>
                <th className="text-right px-4 py-3">Sale Price</th>
                <th className="text-right px-4 py-3">Fee</th>
                <th className="text-right px-4 py-3">Net</th>
                <th className="text-right px-4 py-3">Cost</th>
                <th className="text-right px-4 py-3">P&L</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{sale.set_name ?? sale.set_number ?? '—'}</div>
                    {sale.set_number && <div className="text-xs text-slate-500">{sale.set_number}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(sale.sale_date)}</td>
                  <td className="px-4 py-3">
                    <Badge>{sale.platform}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(sale.sale_price)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{sale.platform_fee_pct}%</td>
                  <td className="px-4 py-3 text-right text-slate-200">{formatCurrency(sale.net_proceeds)}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(sale.purchase_price)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${pnlColor(sale.realized_pnl_pct)}`}>
                    {formatPct(sale.realized_pnl_pct)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteSale(sale.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 text-xs"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log a Sale" size="lg">
        <LogSaleForm onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
