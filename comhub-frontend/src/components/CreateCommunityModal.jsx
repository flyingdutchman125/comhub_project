import { useState } from 'react'

export function CreateCommunityModal({ isOpen, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState({ nama_komunitas: '', deskripsi: '', logo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal membuat komunitas')
      onSuccess()
      setFormData({ nama_komunitas: '', deskripsi: '', logo: '' })
      onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
        <h3 className="text-2xl font-semibold text-white">Buat Komunitas Baru</h3>
        <p className="mt-2 text-slate-400">Anda akan menjadi Ketua komunitas ini</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Nama Komunitas</label>
            <input type="text" name="nama_komunitas" value={formData.nama_komunitas} onChange={(e) => setFormData(p => ({...p, nama_komunitas: e.target.value}))} required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="Nama komunitas Anda" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Deskripsi</label>
            <textarea name="deskripsi" value={formData.deskripsi} onChange={(e) => setFormData(p => ({...p, deskripsi: e.target.value}))} required rows="4"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="Jelaskan tentang komunitas Anda" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Logo URL (Optional)</label>
            <input type="url" name="logo" value={formData.logo} onChange={(e) => setFormData(p => ({...p, logo: e.target.value}))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="https://example.com/logo.png" />
          </div>
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50">
              {loading ? 'Membuat...' : 'Buat Komunitas'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}
