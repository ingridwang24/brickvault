'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Buyer } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AddBuyerForm from '@/components/buyers/AddBuyerForm'
import BuyerDetail from '@/components/buyers/BuyerDetail'

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Buyer | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('buyers').select('*').order('name')
    setBuyers((data as Buyer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteBuyer(id: string) {
    if (!confirm('Delete this buyer?')) return
    const supabase = createClient()
    await supabase.from('buyers').delete().eq('id', id)
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Buyers</h1>
          <p className="text-sm text-slate-400 mt-0.5">{buyers.length} contacts</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Buyer
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : buyers.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No buyers yet.</p>
          <p className="text-sm mt-1">Add your first buyer to start tracking CRM data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyers.map(buyer => (
            <div
              key={buyer.id}
              className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-colors"
              onClick={() => setSelected(buyer)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-100">{buyer.name}</p>
                  {buyer.email && <p className="text-xs text-slate-400 mt-0.5">{buyer.email}</p>}
                  {buyer.ebay_handle && <p className="text-xs text-slate-500">eBay: {buyer.ebay_handle}</p>}
                </div>
                <ChevronRight size={16} className="text-slate-600 shrink-0 mt-0.5" />
              </div>
              {buyer.platforms?.length ? (
                <div className="flex flex-wrap gap-1">
                  {buyer.platforms.map(p => <Badge key={p} variant="info" className="text-[10px]">{p}</Badge>)}
                </div>
              ) : null}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-slate-500">
                  {buyer.last_contacted ? `Last contact: ${formatDate(buyer.last_contacted)}` : 'Never contacted'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); deleteBuyer(buyer.id) }}
                  className="text-red-500/60 hover:text-red-400 text-xs"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Buyer">
        <AddBuyerForm onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        size="lg"
      >
        {selected && <BuyerDetail buyer={selected} />}
      </Modal>
    </div>
  )
}
