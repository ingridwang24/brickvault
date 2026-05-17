-- BrickVault Schema
-- Matches CSV: Title, Set, Theme, Number Available, Current Market Unit Value, Discount Offer Value, Condition Note

create extension if not exists "uuid-ossp";

-- Inventory: LEGO sets owned
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  set_number text not null,
  set_name text,
  theme text,
  description text,
  condition text default 'Sealed' check (condition in ('Sealed', 'Open', 'Used')),
  -- CSV: Number Available
  quantity integer default 1,
  -- CSV: Current Market Unit Value from BrickEconomy
  current_value numeric(10,2),
  -- CSV: Discount Offer Value if not sealed
  discount_price numeric(10,2),
  -- CSV: Note if Box Condition isn't newly stock
  condition_note text,
  -- Purchase tracking (not in CSV, enter manually)
  purchase_price numeric(10,2),
  purchase_date date,
  brickeconomy_url text,
  value_screenshot_url text,
  last_price_update timestamptz,
  status text default 'Holding' check (status in ('Holding', 'Listed', 'Sold')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Buyers CRM
create table if not exists buyers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  ebay_handle text,
  other_contact text,
  platforms text[],
  notes text,
  last_contacted date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sales log
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid references inventory(id) on delete set null,
  buyer_id uuid references buyers(id) on delete set null,
  set_number text,
  set_name text,
  sale_date date not null,
  sale_price numeric(10,2) not null,
  platform text not null,
  platform_fee_pct numeric(5,2) default 13.0,
  purchase_price numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

-- Price history (for future charting)
create table if not exists price_history (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid references inventory(id) on delete cascade,
  value numeric(10,2),
  screenshot_url text,
  recorded_at timestamptz default now()
);

-- Inventory view with P&L (uses purchase_price if available, else 0 basis)
create or replace view inventory_with_pnl as
select
  i.*,
  -- Total current value (qty × unit)
  round((coalesce(i.current_value, 0) * i.quantity)::numeric, 2) as total_current_value,
  -- P&L only meaningful when purchase_price is set
  case
    when i.purchase_price > 0 and i.current_value is not null
    then round(((i.current_value - i.purchase_price) / i.purchase_price * 100)::numeric, 1)
    else null
  end as unrealized_pnl_pct,
  case
    when i.purchase_price is not null and i.current_value is not null
    then round((i.current_value - i.purchase_price)::numeric, 2)
    else null
  end as unrealized_pnl_abs
from inventory i;

-- Sales view with P&L
create or replace view sales_with_pnl as
select
  s.*,
  round((s.sale_price * (1 - s.platform_fee_pct / 100))::numeric, 2) as net_proceeds,
  case
    when s.purchase_price > 0
    then round(((s.sale_price * (1 - s.platform_fee_pct / 100) - s.purchase_price) / s.purchase_price * 100)::numeric, 1)
    else null
  end as realized_pnl_pct
from sales s;
