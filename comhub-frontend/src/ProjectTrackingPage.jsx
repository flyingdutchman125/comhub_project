import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export function ProjectTrackingPage({ communityId, token, isReadOnly = false }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ nama_proyek: '', deskripsi: '', anggaran: '', progress: 0, start_date: '', end_date: '' })

  const fetchProjects = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setProjects(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (communityId) fetchProjects() }, [communityId])

  const handleOpenForm = (project = null) => {
    if (isReadOnly) return
    if (project) {
      setFormData({ 
        nama_proyek: project.name, 
        deskripsi: project.deskripsi || '', 
        anggaran: project.anggaran || '',
        progress: project.progress || 0,
        start_date: project.start_date?.split('T')[0] || '', 
        end_date: project.end_date?.split('T')[0] || '' 
      })
      setEditingId(project.id)
    } else {
      setFormData({ nama_proyek: '', deskripsi: '', anggaran: '', progress: 0, start_date: '', end_date: '' })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let res;
      if (editingId) {
        res = await fetch(`http://localhost:3000/api/projects/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch(`http://localhost:3000/api/communities/${communityId}/projects`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        })
      }
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan')
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: data.message || 'Proyek berhasil disimpan',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
      
      setShowForm(false); setEditingId(null); fetchProjects()
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
      title: 'Hapus Proyek?',
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
        const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal menghapus proyek')
        
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Proyek berhasil dihapus.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#06b6d4'
        })
        fetchProjects()
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

  const getStatusStyle = (status) => {
    if (status === 'On Track' || status === 'Done') return 'bg-emerald-500/10 text-emerald-300'
    if (status === 'At Risk') return 'bg-amber-500/10 text-amber-300'
    return 'bg-slate-700/80 text-slate-200'
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Project Tracking</h3>
            <p className="text-sm text-slate-500">Lihat progress, deadline, dan status untuk setiap proyek.</p>
            {isReadOnly && <p className="text-xs text-amber-400 mt-2">📌 Mode Read-Only</p>}
          </div>
          {!isReadOnly && (
            <button onClick={() => handleOpenForm()} className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15">
              Tambah Proyek Baru
            </button>
          )}
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead><tr className="text-left text-slate-400">
              <th className="pb-4 pr-6">Proyek</th><th className="pb-4 pr-6">Deadline</th><th className="pb-4 pr-6">Status</th><th className="pb-4 pr-6">Progress</th>
              {!isReadOnly && <th className="pb-4">Aksi</th>}
            </tr></thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">Belum ada proyek</td></tr>
              ) : projects.map((p) => (
                <tr key={p.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-4 pr-6 font-medium text-white">{p.name}</td>
                  <td className="py-4 pr-6 text-slate-400">{p.end_date ? new Date(p.end_date).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 pr-6"><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${getStatusStyle(p.status)}`}>{p.status}</span></td>
                  <td className="py-4 pr-6">
                    <div className="w-32 rounded-full bg-slate-800/80 p-1">
                      <div className="rounded-full bg-cyan-400 text-right text-[11px] text-slate-950" style={{ width: `${Math.max(p.progress, 5)}%` }}>
                        <span className="block px-2 py-1">{p.progress}%</span>
                      </div>
                    </div>
                  </td>
                  {!isReadOnly && (
                    <td className="py-4 flex items-center gap-2">
                      <button onClick={() => handleOpenForm(p)} className="rounded-lg px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">Edit</button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="rounded-lg px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && !isReadOnly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Nama Proyek</label>
                <input type="text" value={formData.nama_proyek} onChange={(e) => setFormData(p => ({...p, nama_proyek: e.target.value}))} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Deskripsi</label>
                <textarea value={formData.deskripsi} onChange={(e) => setFormData(p => ({...p, deskripsi: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Anggaran (Rp)</label>
                  <input type="number" value={formData.anggaran} onChange={(e) => setFormData(p => ({...p, anggaran: e.target.value}))} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Progress (%)</label>
                    <input type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData(p => ({...p, progress: Number(e.target.value)}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Tanggal Mulai</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({...p, start_date: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Tanggal Selesai</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({...p, end_date: e.target.value}))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition">{editingId ? 'Perbarui' : 'Tambah'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  )
}
