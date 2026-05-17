'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, DollarSign, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/sales', label: 'Sales', icon: DollarSign },
  { href: '/buyers', label: 'Buyers', icon: Users },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-slate-800 bg-[#0d1018]">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-yellow-400 text-lg tracking-tight">
          🧱 BrickVault
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname === href
                  ? 'bg-yellow-400/10 text-yellow-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          title="Sign out"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
