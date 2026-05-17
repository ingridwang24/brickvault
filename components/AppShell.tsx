'use client'
import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth')

  if (isAuthPage) return <>{children}</>

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
