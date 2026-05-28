import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export function AttendancePage({ communityId, token, isReadOnly = false, currentUserRole = null }) {
    const [sessions, setSessions] = useState([])
    const [summary, setSummary] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeSubTab, setActiveSubTab] = useState('sessions') // 'sessions' or 'recap'
    const [searchQuery, setSearchQuery] = useState('')

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showManageModal, setShowManageModal] = useState(false)

    // Form / Temp States
    const [formData, setFormData] = useState({ title: '', description: '', session_date: new Date().toISOString().split('T')[0] })
    const [editingSession, setEditingSession] = useState(null)
    const [selectedSession, setSelectedSession] = useState(null)
    const [manageRecords, setManageRecords] = useState([])
    const [savingRecords, setSavingRecords] = useState(false)

    const isKetuaOrSekretaris = currentUserRole === 'KETUA' || currentUserRole === 'SEKRETARIS'

    // Fetch All Data
    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Sessions
            const resSessions = await fetch(`http://localhost:3000/api/communities/${communityId}/attendance/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (resSessions.ok) {
                const data = await resSessions.ok ? await resSessions.json() : []
                setSessions(data)
            }

            // Fetch Summary
            const resSummary = await fetch(`http://localhost:3000/api/communities/${communityId}/attendance/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (resSummary.ok) {
                const data = await resSummary.json()
                setSummary(data)
            }
        } catch (err) {
            console.error('Error fetching attendance data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (communityId) fetchData()
    }, [communityId])

    // Handle Create Session
    const handleCreateSession = async (e) => {
        e.preventDefault()
        if (!formData.title || !formData.session_date) return

        try {
            const res = await fetch(`http://localhost:3000/api/communities/${communityId}/attendance/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Gagal membuat sesi absensi')

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Sesi absensi berhasil dibuat.',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#06b6d4',
                timer: 1500,
                showConfirmButton: false
            })

            setShowCreateModal(false)
            setFormData({ title: '', description: '', session_date: new Date().toISOString().split('T')[0] })
            fetchData()
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

    // Handle Edit Session Metadata
    const handleOpenEdit = (session) => {
        setEditingSession(session)
        // Format date string from DB (YYYY-MM-DD...)
        const dateStr = session.session_date ? new Date(session.session_date).toISOString().split('T')[0] : ''
        setFormData({ title: session.title, description: session.description || '', session_date: dateStr })
        setShowEditModal(true)
    }

    const handleEditSession = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(`http://localhost:3000/api/attendance/sessions/${editingSession.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Gagal mengubah detail sesi')

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Detail sesi absensi berhasil diperbarui.',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#06b6d4',
                timer: 1500,
                showConfirmButton: false
            })

            setShowEditModal(false)
            setEditingSession(null)
            setFormData({ title: '', description: '', session_date: new Date().toISOString().split('T')[0] })
            fetchData()
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

    // Handle Delete Session
    const handleDeleteSession = async (sessionId) => {
        const result = await Swal.fire({
            title: 'Hapus Sesi Absensi?',
            text: "Seluruh riwayat kehadiran anggota di sesi ini akan terhapus secara permanen!",
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
                const res = await fetch(`http://localhost:3000/api/attendance/sessions/${sessionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'Gagal menghapus sesi')

                Swal.fire({
                    icon: 'success',
                    title: 'Dihapus!',
                    text: 'Sesi absensi berhasil dihapus.',
                    background: '#0f172a',
                    color: '#fff',
                    confirmButtonColor: '#06b6d4',
                    timer: 1500,
                    showConfirmButton: false
                })
                fetchData()
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

    // Handle Manage Attendance (Open sheet)
    const handleOpenManage = async (session) => {
        setSelectedSession(session)
        setShowManageModal(true)
        try {
            const res = await fetch(`http://localhost:3000/api/attendance/sessions/${session.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setManageRecords(data.records || [])
            }
        } catch (err) {
            console.error('Error fetching session records:', err)
        }
    }

    // Handle local record change
    const handleRecordStatusChange = (userId, newStatus) => {
        setManageRecords(prev => prev.map(rec => {
            if (rec.user_id === userId) {
                return { ...rec, status: newStatus }
            }
            return rec
        }))
    }

    const handleRecordNotesChange = (userId, newNotes) => {
        setManageRecords(prev => prev.map(rec => {
            if (rec.user_id === userId) {
                return { ...rec, notes: newNotes }
            }
            return rec
        }))
    }

    // Save Attendance Records
    const handleSaveRecords = async () => {
        setSavingRecords(true)
        try {
            const res = await fetch(`http://localhost:3000/api/attendance/sessions/${selectedSession.id}/records`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ records: manageRecords })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan absensi')

            Swal.fire({
                icon: 'success',
                title: 'Berhasil Disimpan!',
                text: 'Absensi anggota berhasil diperbarui.',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#06b6d4',
                timer: 1500,
                showConfirmButton: false
            })

            setShowManageModal(false)
            fetchData()
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: err.message,
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#06b6d4'
            })
        } finally {
            setSavingRecords(false)
        }
    }

    // Handle Self Attendance ("Absen Mandiri")
    const handleSelfAttendance = async (session) => {
        try {
            const result = await Swal.fire({
                title: 'Catat Kehadiran Mandiri?',
                text: `Apakah Anda ingin mencatat kehadiran Anda untuk sesi "${session.title}" secara mandiri?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#334155',
                confirmButtonText: 'Ya, Hadir!',
                cancelButtonText: 'Batal',
                background: '#0f172a',
                color: '#fff'
            })

            if (!result.isConfirmed) return

            const res = await fetch(`http://localhost:3000/api/attendance/sessions/${session.id}/self`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Gagal melakukan absen mandiri')

            Swal.fire({
                icon: 'success',
                title: 'Berhasil Absen!',
                text: 'Status kehadiran Anda berhasil diperbarui menjadi HADIR.',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
            })

            fetchData()
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: err.message,
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            })
        }
    }

    // Calculate community statistics
    const calculateStats = () => {
        if (summary.length === 0) return { avgRate: 0, totalSess: sessions.length, perfectCount: 0 }
        
        let totalSessionsCount = sessions.length
        let totalPresent = 0
        let totalRecords = 0
        let perfectCount = 0

        summary.forEach(m => {
            const total = m.total_sessions || 0
            const hadir = m.hadir_count || 0
            if (total > 0) {
                const rate = (hadir / total) * 100
                if (rate === 100) perfectCount++
            }
            totalPresent += hadir
            totalRecords += total
        })

        const avgRate = totalRecords === 0 ? 0 : Math.round((totalPresent / totalRecords) * 100)

        return {
            avgRate,
            totalSess: totalSessionsCount,
            perfectCount
        }
    }

    const stats = calculateStats()

    // Filter Summary by search query
    const filteredSummary = summary.filter(m => 
        (m.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Helper color classes
    const getStatusClass = (status) => {
        switch (status) {
            case 'HADIR': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            case 'SAKIT': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            case 'IZIN': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            case 'ALFA': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            default: return 'bg-slate-700/40 text-slate-300'
        }
    }

    if (loading && sessions.length === 0 && summary.length === 0) {
        return <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>
    }

    return (
        <section className="mt-8 space-y-6">
            {/* Top Cards Statistics */}
            <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                    <div>
                        <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                            Rata-Rata Kehadiran
                        </span>
                        <h4 className="text-slate-400 text-xs mt-3">Persentase kehadiran seluruh anggota</h4>
                    </div>
                    <div className="flex items-baseline mt-6">
                        <span className="text-4xl font-bold text-white">{stats.avgRate}%</span>
                        <span className="text-xs text-slate-500 ml-2">dari semua sesi</span>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                    <div>
                        <span className="rounded-full bg-purple-500/10 text-purple-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                            Total Sesi Absensi
                        </span>
                        <h4 className="text-slate-400 text-xs mt-3">Sesi absensi kegiatan yang telah dibuat</h4>
                    </div>
                    <div className="flex items-baseline mt-6">
                        <span className="text-4xl font-bold text-white">{stats.totalSess}</span>
                        <span className="text-xs text-slate-500 ml-2">Sesi Kegiatan</span>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                    <div>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                            Kehadiran Sempurna
                        </span>
                        <h4 className="text-slate-400 text-xs mt-3">Anggota dengan kehadiran 100%</h4>
                    </div>
                    <div className="flex items-baseline mt-6">
                        <span className="text-4xl font-bold text-white">{stats.perfectCount}</span>
                        <span className="text-xs text-slate-500 ml-2">Anggota</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
                {/* Navigation and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setActiveSubTab('sessions')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition ${
                                activeSubTab === 'sessions' 
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/15' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            📅 Daftar Sesi Absensi
                        </button>
                        <button 
                            onClick={() => setActiveSubTab('recap')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition ${
                                activeSubTab === 'recap' 
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/15' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            📊 Rekap Kehadiran Anggota
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeSubTab === 'recap' && (
                            <input 
                                type="text"
                                placeholder="Cari nama anggota..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-950/80 border border-slate-700 rounded-full px-4 py-1.5 text-xs text-white outline-none focus:border-cyan-500 transition w-full sm:w-48"
                            />
                        )}
                        {!isReadOnly && isKetuaOrSekretaris && activeSubTab === 'sessions' && (
                            <button 
                                onClick={() => {
                                    setFormData({ title: '', description: '', session_date: new Date().toISOString().split('T')[0] })
                                    setShowCreateModal(true)
                                }}
                                className="rounded-full bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-xs hover:bg-cyan-400 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
                            >
                                <span>+</span> Buat Sesi Baru
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub Tab: Sessions List */}
                {activeSubTab === 'sessions' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 border-b border-slate-800 pb-2">
                                    <th className="pb-3 pr-4 font-semibold">Nama Kegiatan</th>
                                    <th className="pb-3 pr-4 font-semibold">Tanggal</th>
                                    <th className="pb-3 pr-4 font-semibold">Keterangan</th>
                                    <th className="pb-3 pr-4 font-semibold">Tingkat Kehadiran</th>
                                    <th className="pb-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-slate-500">
                                            <p className="text-base">Belum ada sesi absensi</p>
                                            {!isReadOnly && isKetuaOrSekretaris && (
                                                <button 
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="mt-3 text-cyan-400 text-xs font-semibold hover:underline"
                                                >
                                                    Buat sesi absensi pertamamu sekarang ➔
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map(sess => {
                                        const rate = sess.total_members === 0 ? 0 : Math.round((sess.total_present / sess.total_members) * 100)
                                        return (
                                            <tr key={sess.id} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition text-slate-300">
                                                <td className="py-4 pr-4 font-medium text-white">{sess.title}</td>
                                                <td className="py-4 pr-4 text-xs font-semibold text-slate-400">
                                                    {new Date(sess.session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 pr-4 text-xs text-slate-400 max-w-[200px] truncate" title={sess.description}>
                                                    {sess.description || '-'}
                                                </td>
                                                <td className="py-4 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${rate}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-white">{rate}%</span>
                                                        <span className="text-[10px] text-slate-500">({sess.total_present}/{sess.total_members})</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {!isKetuaOrSekretaris && (
                                                            <>
                                                                {sess.user_status === 'HADIR' ? (
                                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg shadow-emerald-500/5">
                                                                        Sudah Absen ✓
                                                                    </span>
                                                                ) : sess.user_status === 'SAKIT' ? (
                                                                    <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg shadow-blue-500/5">
                                                                        Sakit 🤒
                                                                    </span>
                                                                ) : sess.user_status === 'IZIN' ? (
                                                                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg shadow-amber-500/5">
                                                                        Izin ✉️
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleSelfAttendance(sess)}
                                                                        className="rounded-lg px-3 py-1.5 text-xs font-bold border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1 shadow-lg shadow-emerald-500/5"
                                                                    >
                                                                        Absen Mandiri 🙋‍♂️
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => handleOpenManage(sess)}
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                                                                !isReadOnly && isKetuaOrSekretaris
                                                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                                                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                                                            }`}
                                                        >
                                                            {!isReadOnly && isKetuaOrSekretaris ? 'Kelola Kehadiran 📝' : 'Lihat Detail 👁️'}
                                                        </button>
                                                        
                                                        {!isReadOnly && isKetuaOrSekretaris && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleOpenEdit(sess)}
                                                                    className="text-slate-400 hover:text-cyan-400 transition text-xs"
                                                                    title="Ubah Detail Sesi"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteSession(sess.id)}
                                                                    className="text-slate-400 hover:text-red-400 transition text-xs"
                                                                    title="Hapus Sesi"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Sub Tab: Recap / Summary Table */
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 border-b border-slate-800 pb-2">
                                    <th className="pb-3 pr-4 font-semibold">Nama Anggota</th>
                                    <th className="pb-3 pr-4 font-semibold">Jabatan</th>
                                    <th className="pb-3 pr-4 font-semibold text-center">Hadir</th>
                                    <th className="pb-3 pr-4 font-semibold text-center">Sakit</th>
                                    <th className="pb-3 pr-4 font-semibold text-center">Izin</th>
                                    <th className="pb-3 pr-4 font-semibold text-center">Alfa</th>
                                    <th className="pb-3 pr-4 font-semibold text-center">Total Sesi</th>
                                    <th className="pb-3 font-semibold text-right">Rasio Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSummary.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-500">
                                            {summary.length === 0 ? 'Belum ada data anggota aktif' : 'Nama tidak ditemukan'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSummary.map(m => {
                                        const total = m.total_sessions || 0
                                        const hadir = m.hadir_count || 0
                                        const rate = total === 0 ? 0 : Math.round((hadir / total) * 100)

                                        return (
                                            <tr key={m.user_id} className="border-b border-slate-800/40 hover:bg-slate-800/10 transition text-slate-300">
                                                <td className="py-4 pr-4 font-medium text-white">{m.nama}</td>
                                                <td className="py-4 pr-4 text-xs">
                                                    <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-400">
                                                        {m.community_role}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-4 text-center font-bold text-emerald-400">{m.hadir_count || 0}</td>
                                                <td className="py-4 pr-4 text-center text-blue-400">{m.sakit_count || 0}</td>
                                                <td className="py-4 pr-4 text-center text-amber-400">{m.izin_count || 0}</td>
                                                <td className="py-4 pr-4 text-center text-rose-400">{m.alfa_count || 0}</td>
                                                <td className="py-4 pr-4 text-center text-slate-400 font-semibold">{total}</td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                            rate >= 80 ? 'bg-emerald-500/10 text-emerald-400'
                                                            : rate >= 60 ? 'bg-amber-500/10 text-amber-400'
                                                            : 'bg-rose-500/10 text-rose-400'
                                                        }`}>
                                                            {rate}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Create Session */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-semibold text-white">Buat Sesi Absensi</h3>
                        <p className="mt-2 text-slate-400 text-sm">Gunakan form ini untuk membuat lembar absensi kegiatan/rapat baru.</p>
                        
                        <form onSubmit={handleCreateSession} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Nama/Judul Kegiatan</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
                                    placeholder="Contoh: Rapat Koordinasi, LDKS" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Tanggal Kegiatan</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={formData.session_date}
                                    onChange={(e) => setFormData(p => ({ ...p, session_date: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Keterangan / Agenda (Opsional)</label>
                                <textarea 
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 text-sm resize-none" 
                                    placeholder="Jelaskan secara singkat mengenai isi rapat..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 transition"
                                >
                                    Buat Sesi
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Session */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-semibold text-white">Ubah Sesi Absensi</h3>
                        <p className="mt-2 text-slate-400 text-sm">Ganti metadata detail mengenai rapat atau kegiatan ini.</p>
                        
                        <form onSubmit={handleEditSession} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Nama/Judul Kegiatan</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Tanggal Kegiatan</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={formData.session_date}
                                    onChange={(e) => setFormData(p => ({ ...p, session_date: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Keterangan / Agenda (Opsional)</label>
                                <textarea 
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 text-sm resize-none" 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 transition"
                                >
                                    Simpan Perubahan
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { setShowEditModal(false); setEditingSession(null) }}
                                    className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal/Sheet: Manage/View Attendance */}
            {showManageModal && selectedSession && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-4xl w-full shadow-2xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-start pb-4 border-b border-slate-800 mb-4">
                            <div>
                                <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                                    Sesi Absensi: {new Date(selectedSession.session_date).toLocaleDateString('id-ID')}
                                </span>
                                <h3 className="text-xl font-bold text-white mt-2">{selectedSession.title}</h3>
                                <p className="text-slate-400 text-xs mt-1">{selectedSession.description || 'Tidak ada keterangan tambahan'}</p>
                            </div>
                            <button 
                                onClick={() => { setShowManageModal(false); setSelectedSession(null); setManageRecords([]) }} 
                                className="text-slate-400 hover:text-white transition text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* List/Table in Modal */}
                        <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 border-b border-slate-800/80 pb-2">
                                        <th className="pb-3 pr-4 font-semibold">Nama Anggota</th>
                                        <th className="pb-3 pr-4 font-semibold">Status Kehadiran</th>
                                        <th className="pb-3 font-semibold">Catatan Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manageRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="py-12 text-center text-slate-500">
                                                Tidak ada rekaman absensi ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        manageRecords.map(rec => (
                                            <tr key={rec.user_id} className="border-b border-slate-800/40 text-slate-300">
                                                <td className="py-3 pr-4 font-medium text-white">
                                                    <div>
                                                        <p className="font-semibold">{rec.nama}</p>
                                                        <p className="text-[10px] text-slate-500">{rec.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {!isReadOnly && isKetuaOrSekretaris ? (
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {['HADIR', 'SAKIT', 'IZIN', 'ALFA'].map(st => (
                                                                <button
                                                                    key={st}
                                                                    type="button"
                                                                    onClick={() => handleRecordStatusChange(rec.user_id, st)}
                                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                                                                        rec.status === st
                                                                            ? st === 'HADIR' ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300'
                                                                                : st === 'SAKIT' ? 'bg-blue-500/25 border-blue-500 text-blue-300'
                                                                                : st === 'IZIN' ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                                                                                : 'bg-rose-500/25 border-rose-500 text-rose-300'
                                                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                                                    }`}
                                                                >
                                                                    {st}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(rec.status)}`}>
                                                            {rec.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    {!isReadOnly && isKetuaOrSekretaris ? (
                                                        <input 
                                                            type="text" 
                                                            value={rec.notes || ''}
                                                            placeholder="Opsional (misal alasan sakit, dll)"
                                                            onChange={(e) => handleRecordNotesChange(rec.user_id, e.target.value)}
                                                            className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-cyan-500 transition w-full max-w-xs"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                            {rec.notes || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Save Action */}
                        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-4">
                            <button 
                                onClick={() => { setShowManageModal(false); setSelectedSession(null); setManageRecords([]) }} 
                                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 text-xs font-semibold transition"
                            >
                                Tutup
                            </button>
                            {!isReadOnly && isKetuaOrSekretaris && (
                                <button 
                                    onClick={handleSaveRecords}
                                    disabled={savingRecords}
                                    className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2 text-xs font-bold transition disabled:opacity-50"
                                >
                                    {savingRecords ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
