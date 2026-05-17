import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function parsePrice(val: string): number | null {
  if (!val) return null
  const cleaned = val.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseQty(val: string): number {
  const n = parseInt(val.trim(), 10)
  return isNaN(n) ? 1 : n
}

function inferCondition(note: string): 'Sealed' | 'Open' | 'Used' {
  const lower = (note ?? '').toLowerCase()
  if (lower.includes('open') || lower.includes('unsealed')) return 'Open'
  if (lower.includes('used') || lower.includes('damaged')) return 'Used'
  return 'Sealed'
}

export async function POST(req: NextRequest) {
  const { rows } = await req.json() as { rows: string[][] }
  if (!rows?.length) return NextResponse.json({ error: 'No rows' }, { status: 400 })

  const supabase = await createClient()

  // CSV columns (0-indexed):
  // 0: Title, 1: Set, 2: Theme, 3: Description, 4: Number Available,
  // 5: Current Market Unit Value, 6: Discount Offer Value, 7: Condition Note, 8: Total Value
  const records = rows
    .filter(row => row[1]?.trim()) // must have set number
    .map(row => {
      const conditionNote = (row[7] ?? '').trim()
      return {
        set_name: (row[0] ?? '').trim() || null,
        set_number: (row[1] ?? '').trim(),
        theme: (row[2] ?? '').trim() || null,
        description: (row[3] ?? '').trim() || null,
        quantity: parseQty(row[4]),
        current_value: parsePrice(row[5]),
        discount_price: parsePrice(row[6]),
        condition_note: conditionNote || null,
        condition: inferCondition(conditionNote),
        status: 'Holding' as const,
        last_price_update: new Date().toISOString(),
      }
    })

  const { data, error } = await supabase
    .from('inventory')
    .insert(records)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length ?? 0 })
}
