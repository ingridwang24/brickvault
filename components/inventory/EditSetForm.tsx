'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { CONDITIONS, STATUSES, InventoryItem } from '@/lib/types'

interface Props {
  item: InventoryItem
  onSuccess: () => void
  onCancel: () => void
}

export default function EditSetForm({ item, onSuccess, onCancel }: Props) {
  const [setName, setSetName] = useState(item.set_name ?? '')
  const [setNumber, setSetNumber] = useState(item.set_number)
  const [theme, setTheme] = useState(item.theme ?? '')
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [condition, setCondition] = useState(item.condition)
  const [conditionNote, setConditionNote] = useState(item.condition_note ?? '')
  const [currentValue, setCurrentValue] = useState(item.current_value != null ? String(item.current_value) : '')
  const [discountPrice, setDiscountPrice] = useState(item.discount_price != null ? String(item.discount_price) : '')
  const [purchasePrice, setPurchasePrice] = useState(item.purchase_price != null ? String(item.purchase_price) : '')
  const [purchaseDate, setPurchaseDate] = useState(item.purchase_date ?? '')
  const [status, setStatus] = useState(item.status)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('inventory')
      .update({
        set_name: setName || null,
        set_number: setNumber.trim(),
        theme: theme || null,
        quantity: parseInt(quantity) || 1,
        condition,
        condition_note: conditionNote || null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        purchase_date: purchaseDate || null,
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input label="Set Name" value={setName} onChange={e => setSetName(e.target.value)} />
        </div>
        <Input label="Set Number" value={setNumber} onChange={e => setSetNumber(e.target.value)} />
        <Input label="Theme" value={theme} onChange={e => setTheme(e.target.value)} />
        <Input label="Quantity" type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <Select
          label="Condition"
          value={condition}
          onChange={e => setCondition(e.target.value as InventoryItem['condition'])}
          options={CONDITIONS.map(c => ({ value: c, label: c }))}
        />
        <Input label="Current Market Value ($)" type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="From BrickEconomy" />
        <Input label="Discount Price ($)" type="number" step="0.01" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} placeholder="If not sealed" />
        <Input label="Purchase Price ($)" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
        <Input label="Purchase Date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
        <Select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value as InventoryItem['status'])}
          options={STATUSES.map(s => ({ value: s, label: s }))}
        />
      </div>
      <Input label="Condition Note" value={conditionNote} onChange={e => setConditionNote(e.target.value)} placeholder="e.g. Box open, build bags sealed" />
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
    </div>
  )
}
