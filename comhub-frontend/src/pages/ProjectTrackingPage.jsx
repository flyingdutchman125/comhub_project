import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
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
  const [activeTab, setActiveTab] = useState('board') // 'board' or 'forum'
  const [discussions, setDiscussions] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editMessageText, setEditMessageText] = useState('')
  const [mentionMenu, setMentionMenu] = useState({ show: false, query: '', index: 0 })
  const [mentionedUsers, setMentionedUsers] = useState([])

  const isKetua = currentUserRole === 'KETUA'
  const isKetuaOrSekretaris = currentUserRole === 'KETUA' || currentUserRole === 'SEKRETARIS'

  const formatMessage = (msgText) => {
    if (!msgText) return '';
    return msgText.split(/(@[a-zA-Z0-9_ ]+)/g).map((part, i) => {
      if (part.startsWith('@')) return <strong key={i} className="text-blue-300 font-bold">{part}</strong>;
      return part;
    });
  };

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
      const [boardRes, membersRes, discRes] = await Promise.all([
        fetch(`http://localhost:3000/api/projects/${projectId}/board`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://localhost:3000/api/communities/${communityId}/members`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://localhost:3000/api/projects/${projectId}/discussions`, { headers: { 'Authorization': `Bearer ${token}` } })
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
          allTasks.map(t => fetch(`http://localhost:3000/api/users/tasks/${t.id}/submissions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.ok ? r.json() : []))
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage, mentions: mentionedUsers })
      })
      const data = await res.json()
      if (res.ok) {
        setNewMessage('')
        setMentionedUsers([])
        // Tambahkan pesan secara instan (Optimistic Update)
        if (data.data) {
           setDiscussions(prev => {
             if (prev.some(d => d.id === data.data.id)) return prev;
             return [...prev, data.data];
           })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDiscussions(prev => prev.filter(d => d.id !== msgId));
    } catch (e) { console.error(e) }
  }

  const handleEditMessageSubmit = async (e, msgId) => {
    e.preventDefault();
    if (!editMessageText.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: editMessageText })
      });
      if (res.ok) {
        setDiscussions(prev => prev.map(d => d.id === msgId ? { ...d, message: editMessageText, is_edited: 1 } : d));
        setEditingMessageId(null);
      }
    } catch (e) { console.error(e) }
  }

  const handleMessageChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);
    if (match) {
      setMentionMenu({ show: true, query: match[1].toLowerCase(), index: match.index });
    } else {
      setMentionMenu({ show: false, query: '', index: 0 });
    }
  }

  const handleMentionSelect = (member) => {
    const textBeforeMention = newMessage.substring(0, mentionMenu.index);
    const textAfterMention = newMessage.substring(mentionMenu.index + mentionMenu.query.length + 1);
    setNewMessage(`${textBeforeMention}@${member.nama} ${textAfterMention}`);
    if (!mentionedUsers.includes(member.user_id)) {
      setMentionedUsers(prev => [...prev, member.user_id]);
    }
    setMentionMenu({ show: false, query: '', index: 0 });
  }

  // Efek Mark As Read
  useEffect(() => {
    if (activeTab === 'forum' && discussions.length > 0 && currentUser && selectedProject) {
      const unreadIds = discussions
        .filter(d => d.user_id !== currentUser.id && (!d.read_by || !d.read_by.includes(currentUser.nama)))
        .map(d => d.id);
        
      if (unreadIds.length > 0) {
        fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ messageIds: unreadIds })
        }).catch(console.error);
        
        setDiscussions(prev => prev.map(d => unreadIds.includes(d.id) ? { ...d, read_by: [...(d.read_by || []), currentUser.nama] } : d));
      }
    }
  }, [discussions, activeTab, currentUser, selectedProject, token])

  useEffect(() => { if (communityId) fetchProjects() }, [communityId])

  // Efek Socket.IO untuk Real-time Diskusi
  useEffect(() => {
    if (!selectedProject) return

    const socket = io('http://localhost:3000')
    socket.emit('join_project', selectedProject.id)

    socket.on('new_message', (msg) => {
      setDiscussions(prev => {
        if (prev.some(d => d.id === msg.id)) return prev;
        return [...prev, msg];
      })
      
      if (currentUser && msg.user_id !== currentUser.id) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `Pesan baru dari ${msg.user_name}`,
          text: msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message,
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#fff',
          iconColor: '#06b6d4'
        })
      }
    })

    socket.on('message_updated', (data) => {
      setDiscussions(prev => prev.map(d => d.id === data.id ? { ...d, message: data.message, is_edited: 1 } : d))
    })

    socket.on('message_deleted', (data) => {
      setDiscussions(prev => prev.filter(d => d.id !== data.id))
    })

    socket.on('message_read', (data) => {
      setDiscussions(prev => prev.map(d => {
        if (data.messageIds.includes(d.id)) {
          const reads = d.read_by || [];
          if (!reads.includes(data.userName)) {
            return { ...d, read_by: [...reads, data.userName] };
          }
        }
        return d;
      }))
    })

    return () => {
      socket.disconnect()
    }
  }, [selectedProject, currentUser])

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
            <div className="flex flex-col h-[500px] rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {discussions.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 text-sm">Belum ada diskusi di proyek ini. Mulai obrolan!</p>
                  </div>
                ) : (
                  discussions.map(msg => {
                    const isMe = currentUser && msg.user_id === currentUser.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {!isMe && <span className="text-xs font-semibold text-cyan-400">{msg.user_name}</span>}
                            <span className="text-[10px] text-slate-500">
                              {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.is_edited ? <span className="text-[10px] italic text-slate-500">(diedit)</span> : null}
                            {isMe && <span className="text-xs font-semibold text-emerald-400">Anda</span>}
                          </div>
                          
                          {editingMessageId === msg.id ? (
                            <form onSubmit={(e) => handleEditMessageSubmit(e, msg.id)} className="w-full flex gap-2 mt-1">
                              <input 
                                type="text" autoFocus value={editMessageText} onChange={e => setEditMessageText(e.target.value)}
                                className="flex-1 text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                              />
                              <button type="submit" className="text-xs bg-cyan-600 px-2 rounded text-white hover:bg-cyan-500">Simpan</button>
                              <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs bg-slate-700 px-2 rounded text-white hover:bg-slate-600">Batal</button>
                            </form>
                          ) : (
                            <div className="group relative">
                              <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                {formatMessage(msg.message)}
                              </div>
                              {/* Edit/Delete Buttons for Sender */}
                              {isMe && (
                                <div className="hidden group-hover:flex absolute top-0 -left-16 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                                  <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.message); }} className="p-1.5 hover:bg-slate-700 text-slate-300 transition" title="Edit">✏️</button>
                                  <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 transition" title="Hapus">🗑️</button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Read Receipts */}
                          {isMe && msg.read_by && msg.read_by.length > 0 && (
                            <div className="text-[9px] text-slate-500 mt-0.5 max-w-[200px] truncate" title={msg.read_by.join(', ')}>
                              Dibaca oleh: {msg.read_by.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-xl relative">
                {/* Mention Menu */}
                {mentionMenu.show && (
                  <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
                    {projectMembers
                      .filter(m => m.nama.toLowerCase().includes(mentionMenu.query))
                      .map(m => (
                        <button 
                          key={m.user_id || m.id} 
                          type="button"
                          onClick={() => handleMentionSelect(m)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                          <div className="font-semibold">{m.nama}</div>
                          <div className="text-xs text-slate-400">{m.community_role}</div>
                        </button>
                      ))}
                    {projectMembers.filter(m => m.nama.toLowerCase().includes(mentionMenu.query)).length === 0 && (
                      <div className="px-4 py-2 text-sm text-slate-500">Tidak ada anggota</div>
                    )}
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder={
                      (isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id)))) 
                        ? "Ketik pesan (ketik @ untuk menandai)..." 
                        : "Akses Read-Only: Anda tidak memiliki tugas di proyek ini."
                    }
                    disabled={!(isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id))))}
                    className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button type="submit" 
                    disabled={!newMessage.trim() || !(isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id))))} 
                    className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    Kirim
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'board' && (
            <>
              {/* 🚨 NOTIFIKASI TUGAS MENUNGGU PERSETUJUAN (KHUSUS KETUA/SEKRETARIS) */}
              {isKetuaOrSekretaris && submissions.filter(s => s.status === 'PENDING').length > 0 && (
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-5 shadow-lg shadow-amber-500/5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1 min-w-0">
                  <h5 className="text-base font-bold text-amber-300 mb-1">Tugas Menunggu Persetujuan</h5>
                  <p className="text-xs text-slate-400 mb-4">
                    Terdapat <span className="font-semibold text-amber-300">{submissions.filter(s => s.status === 'PENDING').length} tugas</span> yang telah dikumpulkan anggota dan membutuhkan persetujuan Anda agar masuk ke Portofolio mereka.
                  </p>
                  
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {submissions.filter(s => s.status === 'PENDING').map(sub => {
                      const allBoardTasks = [
                        ...(taskBoard?.board?.TODO || []),
                        ...(taskBoard?.board?.IN_PROGRESS || []),
                        ...(taskBoard?.board?.DONE || [])
                      ];
                      const relatedTask = allBoardTasks.find(t => t.id === sub.task_id);
                      return (
                        <div key={sub.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-white line-clamp-1">
                                {relatedTask ? relatedTask.judul_tugas : 'Tugas'}
                              </p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                Menunggu
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Oleh: <strong className="text-slate-300 font-semibold">{sub.user_name}</strong> · {new Date(sub.submitted_at).toLocaleDateString('id-ID')}
                            </p>
                            {sub.notes && (
                              <p className="text-[11px] text-slate-400 bg-slate-950/40 rounded px-2 py-1 mt-2 border border-slate-900 italic">
                                "{sub.notes}"
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => downloadFile(sub.id, sub.file_name)}
                              className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 font-semibold transition border border-slate-700/50"
                            >
                              📁 Unduh File
                            </button>
                            <button
                              onClick={() => { setReviewModal(sub); setReviewNote('') }}
                              className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-1.5 transition shadow-lg shadow-amber-500/10"
                            >
                              👍 Tinjau & Acc
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    
                    // Cari submission terkait tugas ini
                    const taskSubs = submissions.filter(s => s.task_id === task.id)
                    const pendingSub = taskSubs.find(s => s.status === 'PENDING')
                    const latestSub = pendingSub || taskSubs[0]

                    return (
                      <div key={task.id} className={`rounded-xl p-3.5 text-sm border transition-all duration-200 ${isMyTask ? 'bg-slate-800 border-cyan-500/30' : 'bg-slate-800/80 border-slate-750/50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-white leading-tight">{task.judul_tugas}</p>
                          {latestSub && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              latestSub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              latestSub.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {latestSub.status === 'APPROVED' ? 'Selesai' : latestSub.status === 'REJECTED' ? 'Revisi' : 'Menunggu'}
                            </span>
                          )}
                        </div>
                        {task.deskripsi && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{task.deskripsi}</p>}
                        
                        {latestSub && latestSub.notes && (
                          <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 rounded p-1.5 border border-slate-800/80">
                            <span className="font-semibold text-slate-300">Catatan:</span> "{latestSub.notes}"
                          </div>
                        )}

                        {assignedMember && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                              👤 {assignedMember.nama}
                            </span>
                            {isMyTask && col !== 'DONE' && (
                              <span className="text-[10px] text-cyan-400">📝 Cek Portofolio</span>
                            )}
                          </div>
                        )}

                        {/* Tombol Acc langsung dari Kanban card jika user adalah Ketua/Sekretaris dan ada pending submission */}
                        {isKetuaOrSekretaris && pendingSub && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-1.5">
                            <button
                              onClick={() => downloadFile(pendingSub.id, pendingSub.file_name)}
                              className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 font-semibold transition border border-slate-600/30"
                            >
                              📁 Unduh File
                            </button>
                            <button
                              onClick={() => { setReviewModal(pendingSub); setReviewNote('') }}
                              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-1.5 transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                            >
                              👍 Acc / Tinjau Tugas
                            </button>
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
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h5 className="text-sm font-semibold text-white mb-3">
                Semua Riwayat Pengumpulan ({submissions.filter(s => s.status === 'PENDING').length} pending)
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
          </>
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
