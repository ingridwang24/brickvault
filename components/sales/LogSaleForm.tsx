'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { PLATFORMS, InventoryItem, Buyer } from '@/lib/types'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function LogSaleForm({ onSuccess, onCancel }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [inventoryId, setInventoryId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [salePrice, setSalePrice] = useState('')
  const [platform, setPlatform] = useState('eBay')
  const [feePct, setFeePct] = useState('13')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('inventory').select('*').order('set_name').then(({ data }) => setInventory((data as InventoryItem[]) ?? []))
    supabase.from('buyers').select('*').order('name').then(({ data }) => setBuyers((data as Buyer[]) ?? []))
  }, [])

  const selectedSet = inventory.find(i => i.id === inventoryId)
  const netProceeds = salePrice && feePct
    ? (parseFloat(salePrice) * (1 - parseFloat(feePct) / 100)).toFixed(2)
    : null

  async function handleSave() {
    if (!saleDate || !salePrice || !platform) { setError('Sale date, price and platform are required'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('sales').insert({
      inventory_id: inventoryId || null,
      buyer_id: buyerId || null,
      set_number: selectedSet?.set_number ?? null,
      set_name: selectedSet?.set_name ?? null,
      sale_date: saleDate,
      sale_price: parseFloat(salePrice),
      platform,
      platform_fee_pct: parseFloat(feePct) || 0,
      purchase_price: selectedSet?.purchase_price ?? null,
      notes: notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="LEGO Set (from inventory)"
        value={inventoryId}
        onChange={e => setInventoryId(e.target.value)}
        options={[
          { value: '', label: '— Select a set —' },
          ...inventory.map(i => ({ value: i.id, label: `${i.set_number} · ${i.set_name ?? '—'}` })),
        ]}
      />

      {selectedSet && (
        <div className="bg-slate-800/50 rounded-lg px-4 py-2 text-xs text-slate-400 flex gap-4">
          <span>Cost: <span className="text-slate-200">${selectedSet.purchase_price ?? '—'}</span></span>
          <span>Current value: <span className="text-emerald-400">${selectedSet.current_value ?? '—'}</span></span>
        </div>
      )}

      <Select
        label="Buyer (optional)"
        value={buyerId}
        onChange={e => setBuyerId(e.target.value)}
        options={[
          { value: '', label: '— No buyer linked —' },
          ...buyers.map(b => ({ value: b.id, label: b.name })),
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Sale Date" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
        <Input label="Sale Price ($)" type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
        <Select
          label="Platform"
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          options={PLATFORMS.map(p => ({ value: p, label: p }))}
        />
        <Input label="Platform Fee (%)" type="number" step="0.1" value={feePct} onChange={e => setFeePct(e.target.value)} />
      </div>

      {netProceeds && (
        <div className="bg-slate-800/50 rounded-lg px-4 py-2 text-sm flex gap-6">
          <span className="text-slate-400">Net proceeds: <span className="text-emerald-400 font-semibold">${netProceeds}</span></span>
          {selectedSet?.purchase_price && (
            <span className="text-slate-400">P&L: <span className={parseFloat(netProceeds) >= selectedSet.purchase_price ? 'text-emerald-400' : 'text-red-400'}>
              {((parseFloat(netProceeds) - selectedSet.purchase_price) / selectedSet.purchase_price * 100).toFixed(1)}%
            </span></span>
          )}
        </div>
      )}

      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>Log Sale</Button>
      </div>
    </div>
  )
}
