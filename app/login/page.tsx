'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const supabase = createClient()

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (err) { setError(err.message); return }
      setMessage('Check your email to confirm your account, then log in.')
      setMode('login')
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧱</div>
          <h1 className="text-2xl font-bold text-slate-100">BrickVault</h1>
          <p className="text-slate-400 text-sm mt-1">LEGO Collector Inventory & CRM</p>
        </div>

        <div className="bg-[#161b27] border border-slate-700 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-emerald-400 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            {mode === 'login' ? (
              <>No account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} className="text-yellow-400 hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); setMessage('') }} className="text-yellow-400 hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
