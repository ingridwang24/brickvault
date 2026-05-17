export interface InventoryItem {
  id: string
  set_number: string
  set_name: string | null
  theme: string | null
  description: string | null
  condition: 'Sealed' | 'Open' | 'Used'
  quantity: number
  current_value: number | null
  discount_price: number | null
  condition_note: string | null
  purchase_price: number | null
  purchase_date: string | null
  brickeconomy_url: string | null
  value_screenshot_url: string | null
  last_price_update: string | null
  status: 'Holding' | 'Listed' | 'Sold'
  notes: string | null
  created_at: string
  updated_at: string
  // from view
  total_current_value?: number | null
  unrealized_pnl_pct?: number | null
  unrealized_pnl_abs?: number | null
}

export interface Buyer {
  id: string
  name: string
  email: string | null
  ebay_handle: string | null
  other_contact: string | null
  platforms: string[] | null
  notes: string | null
  last_contacted: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  inventory_id: string | null
  buyer_id: string | null
  set_number: string | null
  set_name: string | null
  sale_date: string
  sale_price: number
  platform: string
  platform_fee_pct: number
  purchase_price: number | null
  notes: string | null
  created_at: string
  // from view
  net_proceeds?: number | null
  realized_pnl_pct?: number | null
}

export const PLATFORMS = ['eBay', 'Facebook Marketplace', 'Instagram', 'Local Sale', 'BrickLink', 'Other'] as const
export const CONDITIONS = ['Sealed', 'Open', 'Used'] as const
export const STATUSES = ['Holding', 'Listed', 'Sold'] as const
