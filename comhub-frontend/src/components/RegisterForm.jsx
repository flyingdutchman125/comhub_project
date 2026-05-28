import { useState } from 'react'
import { useAuth } from '../AuthContext'

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess }) {
  const { register } = useAuth()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!nama || !email || !password || !confirmPassword) {
      setError('Semua field harus diisi')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setIsLoading(false)
      return
    }

    const result = await register(nama, email, password)
    setIsLoading(false)

    if (result.success) {
      // Auto-switch to login after successful registration
      setTimeout(() => {
        onRegisterSuccess()
      }, 1500)
    } else {
      setError(result.error || 'Registrasi gagal')
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
            <h1 className="text-3xl font-bold text-white">Daftar</h1>
            <p className="mt-2 text-slate-400">Buat akun baru untuk bergabung dengan komunitas</p>
          </div>

          {/* Success Message */}
          {error && error.includes('berhasil') && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-400">{error}</p>
            </div>
          )}

          {/* Error Message */}
          {error && !error.includes('berhasil') && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Sedang daftar...' : 'Daftar'}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Sudah punya akun?{' '}
              <button
                onClick={onSwitchToLogin}
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                Login di sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
