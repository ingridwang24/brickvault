'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Upload, ExternalLink, ImageIcon, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InventoryItem } from '@/lib/types'
import { formatCurrency, formatPct, formatDate, pnlColor } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AddSetForm from '@/components/inventory/AddSetForm'
import EditSetForm from '@/components/inventory/EditSetForm'
import ImportCSV from '@/components/inventory/ImportCSV'
import RefreshPriceButton from '@/components/inventory/RefreshPriceButton'

function conditionVariant(c: string): 'success' | 'warning' | 'default' {
  if (c === 'Sealed') return 'success'
  if (c === 'Open') return 'warning'
  return 'default'
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [screenshot, setScreenshot] = useState<{ url: string; name: string } | null>(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTheme, setFilterTheme] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('inventory_with_pnl')
      .select('*')
      .order('set_name', { ascending: true })
    setItems((data as InventoryItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteItem(id: string, name: string) {
    if (!confirm(`Delete "${name}" from inventory?`)) return
    const supabase = createClient()
    await supabase.from('inventory').delete().eq('id', id)
    load()
  }

  async function refreshAll() {
    setRefreshingAll(true)
    const holding = items.filter(i => i.status !== 'Sold')
    for (const item of holding) {
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ setNumber: item.set_number }),
        })
        const data = await res.json()
        if (res.ok && data.current_value) {
          const supabase = createClient()
          await supabase.from('inventory').update({
            current_value: data.current_value,
            last_price_update: new Date().toISOString(),
            ...(data.set_name && !item.set_name ? { set_name: data.set_name } : {}),
            ...(data.theme && !item.theme ? { theme: data.theme } : {}),
            ...(data.screenshot_base64 ? { value_screenshot_url: `data:image/png;base64,${data.screenshot_base64}` } : {}),
          }).eq('id', item.id)
        }
        // Be polite to BrickEconomy
        await new Promise(r => setTimeout(r, 1500))
      } catch { /* continue */ }
    }
    setRefreshingAll(false)
    load()
  }

  const themes = [...new Set(items.map(i => i.theme).filter(Boolean) as string[])].sort()
  const filtered = items.filter(item => {
    const matchSearch = !search || [item.set_name, item.set_number, item.theme].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
    const matchTheme = !filterTheme || item.theme === filterTheme
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchTheme && matchStatus
  })

  const totalCost = items.reduce((s, i) => s + (i.purchase_price ?? 0) * i.quantity, 0)
  const totalCurrentValue = items.reduce((s, i) => s + (i.current_value ?? 0) * i.quantity, 0)
  const totalSets = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {items.length} titles · {totalSets} units ·
            Current value <span className="text-yellow-400 font-medium">{formatCurrency(totalCurrentValue)}</span>
            {totalCost > 0 && <> · Cost basis {formatCurrency(totalCost)}</>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Import CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={refreshAll} loading={refreshingAll} disabled={refreshingAll}>
            <RefreshCw size={14} /> Refresh All Prices
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Set
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search name, number, theme…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/50 w-64"
        />
        <select
          value={filterTheme}
          onChange={e => setFilterTheme(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none"
        >
          <option value="">All themes</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="Holding">Holding</option>
          <option value="Listed">Listed</option>
          <option value="Sold">Sold</option>
        </select>
        {(search || filterTheme || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterTheme(''); setFilterStatus('') }} className="text-xs text-slate-400 hover:text-slate-200">Clear ✕</button>
        )}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} of {items.length} sets</span>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg mb-2">No sets yet.</p>
          <div className="flex justify-center gap-3">
            <Button variant="primary" onClick={() => setShowImport(true)}><Upload size={14} /> Import from CSV</Button>
            <Button variant="secondary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add manually</Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Set</th>
                <th className="text-left px-4 py-3">Theme</th>
                <th className="text-right px-3 py-3">Qty</th>
                <th className="text-right px-3 py-3">Unit Value</th>
                <th className="text-right px-3 py-3">Discount</th>
                <th className="text-right px-3 py-3">Total Value</th>
                <th className="text-right px-3 py-3">Cost</th>
                <th className="text-right px-3 py-3">P&L</th>
                <th className="text-left px-3 py-3">Condition</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Updated</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-2.5 min-w-[200px]">
                    <div className="font-medium text-slate-100 truncate max-w-[240px]" title={item.set_name ?? item.set_number}>
                      {item.set_name ?? item.set_number}
                    </div>
                    <div className="text-xs text-slate-500">{item.set_number}</div>
                    {item.condition_note && (
                      <div className="text-xs text-yellow-500/80 mt-0.5 truncate max-w-[240px]" title={item.condition_note}>
                        {item.condition_note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-xs max-w-[140px] truncate">{item.theme ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-200">{formatCurrency(item.current_value)}</span>
                      {item.value_screenshot_url && (
                        <button onClick={() => setScreenshot({ url: item.value_screenshot_url!, name: item.set_name ?? item.set_number })} className="text-slate-600 hover:text-slate-300">
                          <ImageIcon size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 text-xs">
                    {item.discount_price ? formatCurrency(item.discount_price) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-yellow-400">
                    {formatCurrency(item.total_current_value)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-400">
                    {item.purchase_price ? formatCurrency(item.purchase_price) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-medium text-xs ${pnlColor(item.unrealized_pnl_pct)}`}>
                    {item.unrealized_pnl_pct != null ? (
                      <>{formatPct(item.unrealized_pnl_pct)}<div className="font-normal">{formatCurrency(item.unrealized_pnl_abs)}</div></>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={conditionVariant(item.condition)}>{item.condition}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={item.status}
                      onChange={async e => {
                        const supabase = createClient()
                        await supabase.from('inventory').update({ status: e.target.value, updated_at: new Date().toISOString() }).eq('id', item.id)
                        load()
                      }}
                      className="bg-transparent text-xs border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none text-slate-300"
                    >
                      <option>Holding</option>
                      <option>Listed</option>
                      <option>Sold</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    <div>{item.last_price_update ? formatDate(item.last_price_update) : '—'}</div>
                    <RefreshPriceButton inventoryId={item.id} setNumber={item.set_number} onRefreshed={load} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                      {item.brickeconomy_url && (
                        <a href={item.brickeconomy_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300">
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button onClick={() => setEditing(item)} className="text-slate-400 hover:text-yellow-400">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteItem(item.id, item.set_name ?? item.set_number)} className="text-slate-500 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add LEGO Set" size="lg">
        <AddSetForm onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import from CSV" size="lg">
        <ImportCSV onSuccess={() => { setShowImport(false); load() }} onCancel={() => setShowImport(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.set_name ?? editing?.set_number}`} size="lg">
        {editing && <EditSetForm item={editing} onSuccess={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!screenshot} onClose={() => setScreenshot(null)} title={`BrickEconomy Value — ${screenshot?.name}`} size="lg">
        {screenshot && <img src={screenshot.url} alt="Price screenshot" className="w-full rounded" />}
      </Modal>
    </div>
  )
}
