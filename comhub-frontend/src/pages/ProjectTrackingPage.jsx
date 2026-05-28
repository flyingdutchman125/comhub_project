import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { exportProjectPDF } from '../pdfExport'

export function ProjectTrackingPage({ communityId, token, isReadOnly = false, currentUserRole = null, currentUser = null }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ nama_proyek: '', deskripsi: '', anggaran: '', progress: 0, start_date: '', end_date: '' })
  const [exporting, setExporting] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectMembers, setProjectMembers] = useState([])
  const [taskBoard, setTaskBoard] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ judul_tugas: '', deskripsi: '', assigned_to: '' })
  const [reviewModal, setReviewModal] = useState(null) // { submission }
  const [reviewNote, setReviewNote] = useState('')

  const isKetua = currentUserRole === 'KETUA'
  const isKetuaOrSekretaris = currentUserRole === 'KETUA' || currentUserRole === 'SEKRETARIS'

  const fetchProjects = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setProjects(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchBoard = async (projectId) => {
    try {
      const [boardRes, membersRes] = await Promise.all([
        fetch(`http://localhost:3000/api/projects/${projectId}/board`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://localhost:3000/api/communities/${communityId}/members`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (boardRes.ok) setTaskBoard(await boardRes.json())
      if (membersRes.ok) setProjectMembers(await membersRes.json())
      // Fetch submissions for all tasks
      const board = await boardRes.clone().json().catch(() => null)
      if (board) {
        const allTasks = [...(board.board?.TODO || []), ...(board.board?.IN_PROGRESS || []), ...(board.board?.DONE || [])]
        const subResults = await Promise.all(
          allTasks.map(t => fetch(`http://localhost:3000/api/users/tasks/${t.id}/submissions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : []))
        )
        setSubmissions(subResults.flat())
      }
    } catch (e) { console.error(e) }
  }

  const handleSelectProject = (p) => {
    if (selectedProject?.id === p.id) { setSelectedProject(null); setTaskBoard(null); setSubmissions([]); return }
    setSelectedProject(p)
    fetchBoard(p.id)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(taskForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: 'Tugas dibuat!', text: data.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4', timer: 1500, showConfirmButton: false })
      setShowTaskForm(false)
      setTaskForm({ judul_tugas: '', deskripsi: '', assigned_to: '' })
      fetchBoard(selectedProject.id)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    }
  }

  const handleReview = async (submissionId, status) => {
    try {
      const res = await fetch(`http://localhost:3000/api/users/submissions/${submissionId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, ketua_note: reviewNote })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: status === 'APPROVED' ? 'Disetujui!' : 'Ditolak', text: data.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4', timer: 1500, showConfirmButton: false })
      setReviewModal(null); setReviewNote('')
      fetchBoard(selectedProject.id); fetchProjects()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    }
  }

  const downloadFile = async (submissionId, fileName) => {
    try {
      const res = await fetch(`http://localhost:3000/api/users/submissions/${submissionId}/download`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      const link = document.createElement('a')
      link.href = `data:${data.file_type};base64,${data.file_data}`
      link.download = data.file_name
      link.click()
    } catch (err) { alert(err.message) }
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

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengambil laporan')

      exportProjectPDF(data)

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: 'Laporan proyek berhasil diunduh sebagai file PDF.',
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
              <button onClick={() => handleOpenForm()} className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15">
                Tambah Proyek Baru
              </button>
            )}
          </div>
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
                  <td className="py-4 pr-6 font-medium text-white">
                    <button onClick={() => handleSelectProject(p)} className="text-left hover:text-cyan-300 transition">
                      {p.name} {selectedProject?.id === p.id ? '▲' : '▼'}
                    </button>
                  </td>
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
                      {isKetua && (
                        <button onClick={() => handleDelete(p.id)} className="rounded-lg px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Hapus</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Task Board Panel ── */}
      {selectedProject && (
        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h4 className="text-base font-semibold text-white">Tugas: {selectedProject.name}</h4>
              <p className="text-xs text-slate-500">{taskBoard?.progressBar || '0%'} selesai</p>
            </div>
            {isKetuaOrSekretaris && (
              <button onClick={() => setShowTaskForm(true)}
                className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition">
                + Bagi Tugas
              </button>
            )}
          </div>

          {/* Kanban columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {['TODO', 'IN_PROGRESS', 'DONE'].map(col => (
              <div key={col} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${col === 'DONE' ? 'text-emerald-400' : col === 'IN_PROGRESS' ? 'text-blue-400' : 'text-slate-400'}`}>
                  {col.replace('_', ' ')}
                </p>
                <div className="space-y-2">
                  {(taskBoard?.board?.[col] || []).map(task => {
                    const assignedMember = projectMembers.find(m => (m.user_id || m.id) === task.assigned_to)
                    const isMyTask = currentUser && task.assigned_to === currentUser.id
                    return (
                      <div key={task.id} className={`rounded-lg p-3 text-sm border ${isMyTask ? 'bg-slate-800 border-cyan-500/30' : 'bg-slate-800/80 border-transparent'}`}>
                        <p className="font-medium text-white">{task.judul_tugas}</p>
                        {task.deskripsi && <p className="text-xs text-slate-400 mt-0.5">{task.deskripsi}</p>}
                        {assignedMember && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                              {assignedMember.nama}
                            </span>
                            {isMyTask && col !== 'DONE' && (
                              <span className="text-[10px] text-cyan-400">📝 Cek Portofolio</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(taskBoard?.board?.[col] || []).length === 0 && <p className="text-xs text-slate-600 text-center py-2">Kosong</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Submissions review (Ketua/Sekretaris) */}
          {isKetuaOrSekretaris && submissions.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-white mb-2">
                Pengumpulan Masuk ({submissions.filter(s => s.status === 'PENDING').length} pending)
              </h5>
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-white">{sub.user_name}</p>
                      <p className="text-xs text-slate-400">{sub.file_name} · {new Date(sub.submitted_at).toLocaleDateString('id-ID')}</p>
                      {sub.notes && <p className="text-xs text-slate-500 mt-0.5">Catatan: {sub.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sub.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : sub.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                        {sub.status}
                      </span>
                      <button onClick={() => downloadFile(sub.id, sub.file_name)} className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600 transition">Unduh</button>
                      {sub.status === 'PENDING' && (
                        <button onClick={() => { setReviewModal(sub); setReviewNote('') }} className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">Tinjau</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Existing Project Form Modal ── */}
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

      {/* ── Create Task Modal ── */}
      {showTaskForm && selectedProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-1">Bagi Tugas</h3>
            <p className="text-sm text-slate-400 mb-5">Proyek: {selectedProject.name}</p>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Judul Tugas</label>
                <input required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
                  value={taskForm.judul_tugas} onChange={e => setTaskForm(p => ({ ...p, judul_tugas: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Deskripsi Tugas</label>
                <textarea rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
                  value={taskForm.deskripsi} onChange={e => setTaskForm(p => ({ ...p, deskripsi: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tugaskan ke Anggota</label>
                <select required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
                  value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">-- Pilih Anggota --</option>
                  {projectMembers.map(m => (
                    <option key={m.user_id || m.id} value={m.user_id || m.id}>{m.nama} ({m.community_role})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 rounded-lg bg-purple-500 py-2 font-semibold text-white hover:bg-purple-400 transition">Bagi Tugas</button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800 transition">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Review Submission Modal ── */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-1">Tinjau Pengumpulan</h3>
            <p className="text-sm text-slate-400 mb-1">Dari: <span className="text-white">{reviewModal.user_name}</span></p>
            <p className="text-sm text-slate-400 mb-5">File: <span className="text-cyan-300">{reviewModal.file_name}</span></p>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Catatan / Feedback (opsional)</label>
              <textarea rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
                placeholder="Tulis catatan untuk anggota..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleReview(reviewModal.id, 'APPROVED')}
                className="flex-1 rounded-lg bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-400 transition">Setujui</button>
              <button onClick={() => handleReview(reviewModal.id, 'REJECTED')}
                className="flex-1 rounded-lg bg-red-500/20 border border-red-500/30 py-2 font-semibold text-red-300 hover:bg-red-500/30 transition">Tolak</button>
              <button onClick={() => setReviewModal(null)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800 transition">Batal</button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}
