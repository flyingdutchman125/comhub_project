import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { exportFinancialPDF } from '../pdfExport'

export function FinancialPage({ communityId, token, isReadOnly = false, currentUserRole = null }) {
  const [financial, setFinancial] = useState({ totalBudget: 0, spent: 0, remaining: 0, transactions: [] })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ type: 'INCOME', amount: '', description: '', transaction_date: '' })
  const [exporting, setExporting] = useState(false)

  const isKetua = currentUserRole === 'KETUA'

  const fetchFinancial = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFinancial(data.financial || { totalBudget: 0, spent: 0, remaining: 0, transactions: [] })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (communityId) fetchFinancial() }, [communityId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menambah transaksi')
        
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Transaksi berhasil ditambahkan.',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
      
      setShowForm(false)
      setFormData({ type: 'INCOME', amount: '', description: '', transaction_date: '' })
      fetchFinancial()
    } catch (err) { 
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Transaksi?',
      text: "Tindakan ini tidak dapat dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/finances/${id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal menghapus transaksi')
        
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Transaksi berhasil dihapus.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#06b6d4'
        })
        fetchFinancial()
      } catch (err) { 
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.message,
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#06b6d4'
        })
      }
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengambil laporan')

      exportFinancialPDF(data)

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: 'Laporan keuangan berhasil diunduh sebagai file PDF.',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Ekspor',
        text: err.message,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { label: 'Total Budget', value: `Rp ${financial.totalBudget.toLocaleString('id-ID')}`, accent: 'bg-blue-500/20 text-blue-300' },
          { label: 'Dikeluarkan', value: `Rp ${financial.spent.toLocaleString('id-ID')}`, accent: 'bg-red-500/20 text-red-300' },
          { label: 'Sisa Budget', value: `Rp ${financial.remaining.toLocaleString('id-ID')}`, accent: 'bg-emerald-500/20 text-emerald-300' }
        ].map(stat => (
          <div key={stat.label} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
            <div className={`inline-flex items-center gap-3 rounded-full px-3 py-2 ${stat.accent}`}>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-200">{stat.label}</p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-semibold text-white">Riwayat Transaksi</h3>
            <p className="text-sm text-slate-500">Catatan pemasukan dan pengeluaran komunitas</p>
            {isReadOnly && <p className="text-xs text-amber-400 mt-2">📌 Mode Read-Only</p>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isKetua && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                <span>📥</span>
                {exporting ? 'Mengekspor...' : 'Ekspor Laporan'}
              </button>
            )}
            {!isReadOnly && (
              <button onClick={() => setShowForm(true)} className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15">
                Tambah Transaksi
              </button>
            )}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {financial.transactions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Belum ada transaksi</p>
          ) : financial.transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <div>
                <p className="font-medium text-white">{tx.description}</p>
                <p className="text-xs text-slate-400">{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('id-ID') : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'} Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                </span>
                {/* Tombol hapus hanya untuk KETUA */}
                {isKetua && !isReadOnly && (
                  <button onClick={() => handleDelete(tx.id)} className="rounded-lg px-2 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && !isReadOnly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white">Tambah Transaksi</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Tipe</label>
                <select value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400">
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Jumlah (Rp)</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData(p => ({...p, amount: e.target.value}))} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Deskripsi</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Tanggal</label>
                <input type="date" value={formData.transaction_date} onChange={(e) => setFormData(p => ({...p, transaction_date: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition">Tambah</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
