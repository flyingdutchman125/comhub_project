import { useState, useEffect } from 'react'

import Swal from 'sweetalert2'
import { exportProjectPDF } from '../pdfExport'
import ProjectFormModal from '../components/Projects/ProjectFormModal'
import TaskFormModal from '../components/Projects/TaskFormModal'
import ReviewModal from '../components/Projects/ReviewModal'
import ProjectKanban from '../components/Projects/ProjectKanban'
import ProjectForum from '../components/Projects/ProjectForum'

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
  const [activeTab, setActiveTab] = useState('board') // 'board' or 'forum'
  const [discussions, setDiscussions] = useState([])

  const isKetua = currentUserRole === 'KETUA'
  const isKetuaOrSekretaris = currentUserRole === 'KETUA' || currentUserRole === 'SEKRETARIS'

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${communityId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setProjects(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchBoard = async (projectId) => {
    try {
      const [boardRes, membersRes, discRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${projectId}/board`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${communityId}/members`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${projectId}/discussions`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      let boardData = null;
      if (boardRes.ok) {
        boardData = await boardRes.json();
        setTaskBoard(boardData);
      }
      if (membersRes.ok) {
        setProjectMembers(await membersRes.json());
      }
      if (discRes.ok) {
        setDiscussions(await discRes.json());
      }
      
      // Fetch submissions for all tasks using the parsed boardData
      if (boardData) {
        const allTasks = [...(boardData.board?.TODO || []), ...(boardData.board?.IN_PROGRESS || []), ...(boardData.board?.DONE || [])]
        const subResults = await Promise.all(
          allTasks.map(t => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/tasks/${t.id}/submissions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : []))
        )
        setSubmissions(subResults.flat())
      }
    } catch (e) { console.error(e) }
  }


  const handleSelectProject = (p) => {
    if (selectedProject?.id === p.id) { 
      setSelectedProject(null); 
      setTaskBoard(null); 
      setSubmissions([]); 
      setActiveTab('board');
      setDiscussions([]);
      return 
    }
    setSelectedProject(p)
    setActiveTab('board')
    fetchBoard(p.id)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${communityId}/projects/${selectedProject.id}/tasks`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/submissions/${submissionId}/review`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/submissions/${submissionId}/download`, { headers: { 'Authorization': `Bearer ${token}` } })
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
        res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        })
      } else {
        res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${communityId}/projects`, {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${communityId}/report`, {
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSelectProject(p)} 
                        className={`text-left transition ${p.approval_status === 'PENDING' ? 'opacity-50 cursor-not-allowed' : 'hover:text-cyan-300'}`}
                        disabled={p.approval_status === 'PENDING'}
                      >
                        {p.name} {selectedProject?.id === p.id ? '▲' : '▼'}
                      </button>
                      {p.approval_status === 'PENDING' && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full uppercase font-bold border border-yellow-500/30">
                          Menunggu ACC Dosen
                        </span>
                      )}
                      {p.approval_status === 'REJECTED' && (
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full uppercase font-bold border border-red-500/30" title="Ditolak oleh Dosen">
                          Ditolak
                        </span>
                      )}
                    </div>
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
              <h4 className="text-base font-semibold text-white">Proyek: {selectedProject.name}</h4>
              <p className="text-xs text-slate-500">{taskBoard?.progressBar || '0%'} selesai</p>
            </div>
            {isKetuaOrSekretaris && activeTab === 'board' && (
              <button onClick={() => setShowTaskForm(true)}
                className="rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition">
                + Bagi Tugas
              </button>
            )}
          </div>

          <div className="flex border-b border-slate-800 mb-5">
            <button 
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'board' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              onClick={() => setActiveTab('board')}
            >
              Papan Tugas
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'forum' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              onClick={() => setActiveTab('forum')}
            >
              Forum Diskusi
            </button>
          </div>

          {activeTab === 'forum' && (
            <ProjectForum
              discussions={discussions}
              setDiscussions={setDiscussions}
              selectedProject={selectedProject}
              currentUser={currentUser}
              token={token}
              projectMembers={projectMembers}
              taskBoard={taskBoard}
              isKetuaOrSekretaris={isKetuaOrSekretaris}
              activeTab={activeTab}
            />
          )}

          {activeTab === 'board' && (
            <ProjectKanban
              taskBoard={taskBoard}
              projectMembers={projectMembers}
              currentUser={currentUser}
              submissions={submissions}
              isKetuaOrSekretaris={isKetuaOrSekretaris}
              setReviewModal={setReviewModal}
              setReviewNote={setReviewNote}
              downloadFile={downloadFile}
            />
          )}
        </div>
      )}

      <ProjectFormModal 
        showForm={showForm} 
        isReadOnly={isReadOnly} 
        editingId={editingId} 
        formData={formData} 
        setFormData={setFormData} 
        handleSubmit={handleSubmit} 
        setShowForm={setShowForm} 
      />

      <TaskFormModal 
        showTaskForm={showTaskForm} 
        selectedProject={selectedProject} 
        taskForm={taskForm} 
        setTaskForm={setTaskForm} 
        handleCreateTask={handleCreateTask} 
        setShowTaskForm={setShowTaskForm} 
        projectMembers={projectMembers} 
      />

      <ReviewModal 
        reviewModal={reviewModal} 
        reviewNote={reviewNote} 
        setReviewNote={setReviewNote} 
        handleReview={handleReview} 
        setReviewModal={setReviewModal} 
      />

    </section>
  )
}
