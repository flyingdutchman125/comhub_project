import { useState } from 'react'
import { useAuth } from './AuthContext'

export function CommunityDetailPage({ community, onBack, isMember = false }) {
  const { token } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(isMember)

  const mockMembers = [
    { id: 1, name: 'Ahmad Rizki', role: 'KETUA', joined: '15 Jan 2024' },
    { id: 2, name: 'Siti Nurhaliza', role: 'SEKRETARIS', joined: '20 Jan 2024' },
    { id: 3, name: 'Budi Santoso', role: 'BENDAHARA', joined: '22 Jan 2024' },
    { id: 4, name: 'Nadia Pratama', role: 'ANGGOTA', joined: '25 Jan 2024' },
    { id: 5, name: 'Eka Putra', role: 'ANGGOTA', joined: '26 Jan 2024' },
  ]

  const mockProjects = [
    { id: 1, name: 'Pembangunan Website Komunitas', status: 'In Progress', progress: 76 },
    { id: 2, name: 'Program Pelatihan UI/UX', status: 'Planning', progress: 32 },
    { id: 3, name: 'Event Showcase Komunitas', status: 'At Risk', progress: 54 },
  ]

  const mockFinancial = {
    totalBudget: 'Rp 50.000.000',
    spent: 'Rp 32.500.000',
    remaining: 'Rp 17.500.000',
    transactions: [
      { id: 1, description: 'Pembelian Server', amount: 'Rp 10.000.000', date: '2024-01-15', type: 'expense' },
      { id: 2, description: 'Donasi Sponsor', amount: 'Rp 5.000.000', date: '2024-01-18', type: 'income' },
      { id: 3, description: 'Pembelian Equipment', amount: 'Rp 8.500.000', date: '2024-01-20', type: 'expense' },
      { id: 4, description: 'Iuran Anggota', amount: 'Rp 9.000.000', date: '2024-01-22', type: 'income' },
    ],
  }

  const handleJoinCommunity = async () => {
    setIsJoining(true)
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${community.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mendaftar')
      }

      setHasJoined(true)
    } catch (err) {
      console.error('Join error', err)
      // Optionally show an error toast
    } finally {
      setIsJoining(false)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'KETUA':
        return 'bg-amber-500/20 text-amber-300'
      case 'SEKRETARIS':
        return 'bg-blue-500/20 text-blue-300'
      case 'BENDAHARA':
        return 'bg-emerald-500/20 text-emerald-300'
      default:
        return 'bg-slate-700/40 text-slate-300'
    }
  }

  return (
    <div className="min-h-screen bg-[#060b1b]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ← Kembali
              </button>
              <h1 className="text-3xl font-bold text-white">{community.name}</h1>
              <p className="mt-2 text-slate-400">{community.description}</p>
            </div>
            
            {!hasJoined && (
              <button
                onClick={handleJoinCommunity}
                disabled={isJoining}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 h-fit transition"
              >
                {isJoining ? 'Sedang bergabung...' : 'Bergabung dengan Komunitas'}
              </button>
            )}

            {hasJoined && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 h-fit">
                <p className="text-sm font-semibold text-emerald-300">✓ Anda sudah bergabung</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Project Tracking & Financial */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Tracking */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">📊 Project Tracking</h2>
                <p className="mt-1 text-slate-400">Program kerja yang sedang berjalan dalam komunitas</p>
              </div>

              <div className="space-y-4">
                {mockProjects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <p className="mt-1 text-xs text-slate-400">Status: {project.status}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        project.status === 'In Progress'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : project.status === 'At Risk'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-700/40 text-slate-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Financial */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">💰 Keuangan</h2>
                <p className="mt-1 text-slate-400">Ringkasan anggaran dan transaksi komunitas</p>
              </div>

              {/* Budget Summary */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Anggaran</p>
                  <p className="text-2xl font-bold text-white">{mockFinancial.totalBudget}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Terpakai</p>
                  <p className="text-2xl font-bold text-red-400">{mockFinancial.spent}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sisa</p>
                  <p className="text-2xl font-bold text-emerald-400">{mockFinancial.remaining}</p>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="font-semibold text-white mb-4">Riwayat Transaksi</h3>
                <div className="space-y-2">
                  {mockFinancial.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-slate-400">{transaction.date}</p>
                      </div>
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} {transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Members */}
          <aside>
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10 sticky top-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">👥 Anggota</h2>
                <p className="mt-1 text-sm text-slate-400">{mockMembers.length} anggota aktif</p>
              </div>

              <div className="space-y-3">
                {mockMembers.map((member) => (
                  <div key={member.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{member.name}</p>
                        <p className="text-xs text-slate-400 mt-1">Bergabung: {member.joined}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
