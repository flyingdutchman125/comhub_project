import { useState } from 'react'
import { useAuth } from '../AuthContext'

export function LoginForm({ onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Email dan password tidak boleh kosong')
      setIsLoading(false)
      return
    }

    const result = await login(email, password)
    setIsLoading(false)

    if (result.success) {
      onLoginSuccess()
    } else {
      setError(result.error || 'Login gagal')
    }
  }

  return (
    <div className="min-h-screen bg-[#060b1b] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/10">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-800/80 px-4 py-2 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center text-lg text-slate-950 font-bold">
                C
              </div>
              <span className="text-sm font-semibold text-white">ComHub</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Login</h1>
            <p className="mt-2 text-slate-400">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Sedang login...' : 'Login'}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Belum punya akun?{' '}
              <button
                onClick={onSwitchToRegister}
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
