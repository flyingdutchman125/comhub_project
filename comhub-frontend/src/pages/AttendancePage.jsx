import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { AttendanceStats } from '../components/AttendanceStats'
import { CreateSessionModal } from '../components/Attendance/CreateSessionModal'
import { EditSessionModal } from '../components/Attendance/EditSessionModal'
import { ManageAttendanceModal } from '../components/Attendance/ManageAttendanceModal'
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
            const total = Number(m.total_sessions) || 0
            const hadir = Number(m.hadir_count) || 0
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
            <AttendanceStats stats={stats} />

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
                                        const total = Number(m.total_sessions) || 0
                                        const hadir = Number(m.hadir_count) || 0
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

            <CreateSessionModal
                showCreateModal={showCreateModal}
                setShowCreateModal={setShowCreateModal}
                formData={formData}
                setFormData={setFormData}
                handleCreateSession={handleCreateSession}
            />

            <EditSessionModal
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                formData={formData}
                setFormData={setFormData}
                handleEditSession={handleEditSession}
                setEditingSession={setEditingSession}
            />

            <ManageAttendanceModal
                showManageModal={showManageModal}
                setShowManageModal={setShowManageModal}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                manageRecords={manageRecords}
                setManageRecords={setManageRecords}
                isReadOnly={isReadOnly}
                isKetuaOrSekretaris={isKetuaOrSekretaris}
                handleRecordStatusChange={handleRecordStatusChange}
                handleRecordNotesChange={handleRecordNotesChange}
                handleSaveRecords={handleSaveRecords}
                savingRecords={savingRecords}
                getStatusClass={getStatusClass}
            />
        </section>
    )
}
