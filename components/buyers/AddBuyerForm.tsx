'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PLATFORMS } from '@/lib/types'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddBuyerForm({ onSuccess, onCancel }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ebayHandle, setEbayHandle] = useState('')
  const [otherContact, setOtherContact] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('buyers').insert({
      name: name.trim(),
      email: email || null,
      ebay_handle: ebayHandle || null,
      other_contact: otherContact || null,
      platforms: selectedPlatforms.length ? selectedPlatforms : null,
      notes: notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Full name or handle" />
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <Input label="eBay Handle" value={ebayHandle} onChange={e => setEbayHandle(e.target.value)} />
      <Input label="Other Contact" value={otherContact} onChange={e => setOtherContact(e.target.value)} placeholder="Instagram, phone, etc." />

      <div className="flex flex-col gap-1">
        <p className="text-xs text-slate-400 font-medium">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                selectedPlatforms.includes(p)
                  ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context about this buyer" />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>Add Buyer</Button>
      </div>
    </div>
  )
}
