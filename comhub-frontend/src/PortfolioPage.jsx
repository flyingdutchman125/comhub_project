import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import CropModal from './CropModal'

const STATUS_CONFIG = {
  APPROVED: { label: 'Disetujui', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  PENDING:  { label: 'Menunggu', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  REJECTED: { label: 'Ditolak',  color: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

// ─── Sub-components ──────────────────────────────────────────

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-700 text-slate-400 border-slate-600' }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function StatCard({ value, label, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────

function EditProfileModal({ profile, onClose, onSaved, token }) {
  const [form, setForm] = useState({
    nama: profile?.nama || '',
    prodi: profile?.prodi || '',
    bio: profile?.bio || '',
    skills: (profile?.skills || []).join(', '),
    foto_profile: profile?.foto_profile || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const cropCallbackRef = useRef(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Format file tidak didukung. Harap pilih gambar.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal adalah 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropSrc(ev.target.result)
      cropCallbackRef.current = (cropped) => setForm(p => ({ ...p, foto_profile: cropped }))
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, skills })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-lg w-full shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-5">Edit Profil</h3>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div 
              onClick={() => fileRef.current.click()} 
              className="relative group cursor-pointer h-24 w-24 rounded-3xl overflow-hidden border border-slate-700 shadow-md transition hover:border-cyan-500"
            >
              {form.foto_profile ? (
                <img 
                  src={form.foto_profile} 
                  alt="Preview" 
                  className="h-full w-full object-cover group-hover:opacity-85 transition" 
                />
              ) : (
                <div className="h-full w-full bg-slate-800 flex flex-col items-center justify-center text-slate-400 group-hover:text-cyan-300 transition">
                  <span className="text-2xl">📷</span>
                  <span className="text-[10px] mt-1 font-semibold">Pilih Foto</span>
                </div>
              )}
              {/* Overlay edit badge */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                <span className="text-xs text-cyan-300 font-bold">Ubah Foto</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            {showCropModal && cropSrc && (
              <CropModal
                imageSrc={cropSrc}
                aspect={1}
                onCancel={() => { setShowCropModal(false); setCropSrc(null); cropCallbackRef.current = null }}
                onCropDone={(cropped) => {
                  if (cropCallbackRef.current) cropCallbackRef.current(cropped)
                  setShowCropModal(false); setCropSrc(null); cropCallbackRef.current = null
                }}
              />
            )}
            <p className="text-[10px] text-slate-500">Maksimal 2MB (JPG, PNG)</p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Nama Lengkap</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
              value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Program Studi (Prodi)</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
              placeholder="cth: Teknik Informatika" value={form.prodi} onChange={e => setForm(p => ({ ...p, prodi: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Bio / Deskripsi Diri</label>
            <textarea rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
              placeholder="Ceritakan tentang dirimu..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Keahlian (pisahkan dengan koma)</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
              placeholder="cth: React, Python, Desain UI" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-cyan-500 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800 transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Submit Task Modal ────────────────────────────────────────

function SubmitTaskModal({ task, onClose, onSubmitted, token }) {
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setFile({ name: f.name, type: f.type, data: ev.target.result.split(',')[1] })
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Pilih file terlebih dahulu.')
    setLoading(true); setError(null)
    try {
      const res = await fetch(`http://localhost:3000/api/users/tasks/${task.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ file_name: file.name, file_data: file.data, file_type: file.type, notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onSubmitted()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-1">Kumpulkan Tugas</h3>
        <p className="text-sm text-slate-400 mb-5">{task.judul_tugas}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">File Dokumen / PDF</label>
            <button type="button" onClick={() => fileRef.current.click()}
              className="w-full rounded-lg border-2 border-dashed border-slate-700 p-4 text-center text-slate-400 hover:border-cyan-500 hover:text-cyan-300 transition">
              {file ? <span className="text-cyan-300 text-sm">✓ {file.name}</span> : 'Klik untuk pilih file'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Catatan (opsional)</label>
            <textarea rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400"
              placeholder="Tulis catatan untuk ketua..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-cyan-500 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
              {loading ? 'Mengumpulkan...' : 'Kumpulkan'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800 transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Portfolio Page ──────────────────────────────────────

export function PortfolioPage() {
  const { token } = useAuth()
  const [data, setData]         = useState(null)
  const [myTasks, setMyTasks]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('portfolio') // 'portfolio' | 'tasks'
  const [showEdit, setShowEdit] = useState(false)
  const [submitTask, setSubmitTask] = useState(null)
  const [expanded, setExpanded] = useState({})

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, t] = await Promise.all([
        fetch('http://localhost:3000/api/users/portfolio', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('http://localhost:3000/api/users/tasks',     { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      ])
      setData(p)
      setMyTasks(Array.isArray(t) ? t : [])
      // Auto-expand projects
      const exp = {}
      p.portfolio?.forEach(c => c.projects?.forEach(pr => { exp[pr.project_id] = true }))
      setExpanded(exp)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) fetchAll() }, [token])

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
    </div>
  )

  const { user, stats, memberships, portfolio } = data || {}
  const initials = user?.nama?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const pendingTasks  = myTasks.filter(t => !t.submission_status)
  const submittedTasks = myTasks.filter(t => t.submission_status === 'PENDING')
  const approvedTasks  = myTasks.filter(t => t.submission_status === 'APPROVED')

  return (
    <section className="mt-8 space-y-6 pb-10">
      {/* ── Profile Hero ── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={() => setShowEdit(true)}>
            {user?.foto_profile ? (
              <img 
                src={user.foto_profile} 
                alt="Foto Profil" 
                className="h-20 w-20 rounded-3xl object-cover shadow-xl shadow-cyan-500/20 border border-slate-700 transition group-hover:opacity-85" 
              />
            ) : (
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-cyan-500/20 transition group-hover:opacity-85">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{user?.nama || 'User'}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user?.prodi || <span className="italic text-slate-600">Prodi belum diisi</span>}</p>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
            {user?.bio && <p className="text-slate-300 text-sm mt-2 max-w-xl">{user.bio}</p>}

            {/* Skills */}
            {user?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {user.skills.map(s => (
                  <span key={s} className="rounded-full bg-slate-800 border border-slate-700 px-3 py-0.5 text-xs text-slate-300">{s}</span>
                ))}
              </div>
            )}

            {/* Communities */}
            <div className="flex flex-wrap gap-2 mt-3">
              {memberships?.map(m => (
                <span key={m.community_id} className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
                  {m.nama_komunitas} · <span className="font-semibold">{m.community_role}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Edit + Progress ring */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#06b6d4" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - (stats?.completionRate || 0) / 100)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{stats?.completionRate || 0}%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Completion</p>
            <button onClick={() => setShowEdit(true)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition">
              Edit Profil
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats?.totalCommunities || 0} label="UKM / Komunitas" color="text-cyan-400" />
        <StatCard value={stats?.totalProjects || 0} label="Proyek" color="text-purple-400" />
        <StatCard value={stats?.approvedTasks || 0} label="Tugas Disetujui" color="text-emerald-400" />
        <StatCard value={stats?.pendingTasks || 0} label="Menunggu Review" color="text-amber-400" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {[['portfolio', 'Portofolio'], ['tasks', `To-Do List (${pendingTasks.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${tab === key ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Portfolio ── */}
      {tab === 'portfolio' && (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
          <h2 className="text-xl font-semibold text-white mb-1">Riwayat Kontribusi</h2>
          <p className="text-sm text-slate-500 mb-6">Tugas yang disetujui otomatis masuk ke portofolio Anda.</p>

          {!portfolio || portfolio.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-slate-400">Belum ada kontribusi yang disetujui.</p>
              <p className="text-slate-500 text-sm mt-1">Kumpulkan tugas dan tunggu persetujuan Ketua.</p>
            </div>
          ) : portfolio.map(comm => (
            <div key={comm.community_id} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-300">
                  {comm.community_name?.charAt(0)}
                </div>
                <h3 className="text-base font-semibold text-white">{comm.community_name}</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-slate-800 ml-3.5">
                {comm.projects.map(proj => {
                  const done = proj.tasks.filter(t => t.submission_status === 'APPROVED').length
                  const total = proj.tasks.length
                  const isExp = expanded[proj.project_id]
                  return (
                    <div key={proj.project_id} className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                      <button onClick={() => setExpanded(p => ({ ...p, [proj.project_id]: !p[proj.project_id] }))}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-800/30 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{proj.project_name}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                              <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                style={{ width: total > 0 ? `${Math.round(done/total*100)}%` : '0%' }} />
                            </div>
                            <span className="text-[11px] text-slate-400">{done}/{total} disetujui</span>
                          </div>
                        </div>
                        <span className={`text-slate-400 text-xs transition-transform duration-200 ${isExp ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {isExp && (
                        <div className="border-t border-slate-800 divide-y divide-slate-800/60">
                          {proj.tasks.map(task => (
                            <div key={task.task_id} className="flex items-start gap-3 px-4 py-3">
                              <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${task.submission_status === 'APPROVED' ? 'bg-emerald-400' : task.submission_status === 'PENDING' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${task.submission_status === 'APPROVED' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{task.judul_tugas}</p>
                                {task.task_desc && <p className="text-xs text-slate-500 mt-0.5">{task.task_desc}</p>}
                              </div>
                              {task.submission_status && <Badge status={task.submission_status} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: My Tasks / To-Do ── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {myTasks.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-14 text-center">
              <p className="text-slate-400">Belum ada tugas yang diberikan kepada Anda.</p>
            </div>
          ) : myTasks.map(task => (
            <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{task.judul_tugas}</p>
                    {task.submission_status && <Badge status={task.submission_status} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {task.nama_komunitas} · {task.project_name}
                    {task.end_date && ` · Deadline: ${new Date(task.end_date).toLocaleDateString('id-ID')}`}
                  </p>
                  {task.deskripsi && <p className="text-sm text-slate-400 mt-2">{task.deskripsi}</p>}
                  {task.ketua_note && (
                    <p className="text-xs text-amber-300 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                      Catatan Ketua: {task.ketua_note}
                    </p>
                  )}
                  {task.file_name && (
                    <p className="text-xs text-slate-400 mt-1.5">File dikumpulkan: <span className="text-cyan-300">{task.file_name}</span></p>
                  )}
                </div>
                {!task.submission_status && (
                  <button onClick={() => setSubmitTask(task)}
                    className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition flex-shrink-0">
                    Kumpulkan
                  </button>
                )}
                {task.submission_status === 'REJECTED' && (
                  <button onClick={() => setSubmitTask(task)}
                    className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition flex-shrink-0">
                    Kumpulkan Ulang
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEdit && <EditProfileModal profile={user} token={token} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); fetchAll() }} />}
      {submitTask && <SubmitTaskModal task={submitTask} token={token} onClose={() => setSubmitTask(null)} onSubmitted={() => { setSubmitTask(null); fetchAll() }} />}
    </section>
  )
}
