'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { CONDITIONS } from '@/lib/types'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddSetForm({ onSuccess, onCancel }: Props) {
  const [setNumber, setSetNumber] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [condition, setCondition] = useState<string>('Sealed')
  const [notes, setNotes] = useState('')
  const [scraping, setScraping] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scraped, setScraped] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  async function handleScrape() {
    if (!setNumber.trim()) return
    setScraping(true)
    setError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setNumber: setNumber.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scrape failed')
      setScraped(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Scrape failed')
    } finally {
      setScraping(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    let screenshotUrl: string | null = null
    if (scraped?.screenshot_base64) {
      // Store screenshot as data URI in DB (for small images; replace with storage for production)
      screenshotUrl = `data:image/png;base64,${scraped.screenshot_base64}`
    }

    const { error: err } = await supabase.from('inventory').insert({
      set_number: (scraped?.set_number as string) ?? setNumber.trim(),
      set_name: scraped?.set_name ?? null,
      theme: scraped?.theme ?? null,
      piece_count: scraped?.piece_count ?? null,
      condition,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_date: purchaseDate || null,
      quantity: parseInt(quantity) || 1,
      current_value: scraped?.current_value ?? null,
      brickeconomy_url: scraped?.brickeconomy_url ?? null,
      value_screenshot_url: screenshotUrl,
      last_price_update: scraped ? new Date().toISOString() : null,
      notes: notes || null,
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Step 1: set number + scrape */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Set Number"
            placeholder="e.g. 10211 or 10211-1"
            value={setNumber}
            onChange={e => setSetNumber(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleScrape} loading={scraping} disabled={!setNumber.trim()}>
          {scraped ? 'Re-scrape' : 'Lookup'}
        </Button>
      </div>

      {scraped && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col gap-2 text-sm">
          <p className="font-medium text-slate-100">{scraped.set_name as string ?? '—'}</p>
          <div className="flex gap-4 text-slate-400 text-xs">
            <span>Theme: <span className="text-slate-200">{scraped.theme as string ?? '—'}</span></span>
            <span>Pieces: <span className="text-slate-200">{scraped.piece_count as number ?? '—'}</span></span>
            <span>Current Value: <span className="text-emerald-400 font-semibold">${scraped.current_value as number ?? '—'}</span></span>
          </div>
          {scraped.screenshot_base64 ? (
            <img
              src={`data:image/png;base64,${scraped.screenshot_base64 as string}`}
              alt="BrickEconomy value section"
              className="rounded mt-1 max-h-40 object-contain border border-slate-700"
            />
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label="Purchase Price ($)" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" />
        <Input label="Purchase Date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        <Input label="Quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <Select
          label="Condition"
          value={condition}
          onChange={e => setCondition(e.target.value)}
          options={CONDITIONS.map(c => ({ value: c, label: c }))}
        />
      </div>

      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bought at Target clearance" />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={!setNumber.trim()}>
          Save to Inventory
        </Button>
      </div>
    </div>
  )
}
