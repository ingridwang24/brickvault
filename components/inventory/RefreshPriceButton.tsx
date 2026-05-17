'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Props {
  inventoryId: string
  setNumber: string
  onRefreshed: () => void
}

export default function RefreshPriceButton({ inventoryId, setNumber, onRefreshed }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scrape failed')

      const supabase = createClient()
      const screenshotUrl = data.screenshot_base64
        ? `data:image/png;base64,${data.screenshot_base64}`
        : undefined

      await supabase.from('inventory').update({
        current_value: data.current_value,
        last_price_update: new Date().toISOString(),
        ...(screenshotUrl ? { value_screenshot_url: screenshotUrl } : {}),
        ...(data.set_name ? { set_name: data.set_name } : {}),
        ...(data.theme ? { theme: data.theme } : {}),
        ...(data.piece_count ? { piece_count: data.piece_count } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', inventoryId)

      onRefreshed()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button size="sm" variant="ghost" onClick={refresh} loading={loading} title="Refresh price from BrickEconomy">
        <RefreshCw size={12} />
        {loading ? 'Refreshing…' : 'Refresh'}
      </Button>
      {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
    </div>
  )
}
