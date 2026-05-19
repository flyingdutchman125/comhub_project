import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { exportMemberPDF } from './pdfExport'

export function MemberPage({ communityId, token, isReadOnly = false, currentUserRole = null }) {
  const [members, setMembers] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const isKetua = currentUserRole === 'KETUA'

  const fetchMembers = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }

      if (currentUserRole === 'KETUA') {
        const appRes = await fetch(`http://localhost:3000/api/communities/${communityId}/applicants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (appRes.ok) {
          const appData = await appRes.json()
          setApplicants(appData || [])
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (communityId) fetchMembers() }, [communityId, currentUserRole])

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/members/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newRole })
      })
      
      const data = await res.json()
      if (!res.ok) {
        if (data.error_code === 'MULTIPLE_COMMUNITIES') {
          const result = await Swal.fire({
            title: 'Validasi Gagal',
            text: data.message + '\n\nKirim pesan peringatan kepada anggota ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#06b6d4',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Kirim Pesan',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
          })

          if (result.isConfirmed) {
            // Send warning message
            await fetch('http://localhost:3000/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                receiver_id: userId,
                subject: 'Penawaran Jabatan Pengurus Inti',
                content: `Halo, kamu ditawari jabatan sebagai ${newRole} di komunitas ini, namun kamu masih tergabung di komunitas lain.\n\nSyarat menjadi pengurus inti adalah kamu hanya boleh berada di 1 komunitas.\n\nApakah kamu bersedia keluar dari semua komunitas lain untuk menerima jabatan ini?`,
                type: 'PROMOTION_OFFER',
                community_id: communityId,
                role_offered: newRole
              })
            })
            Swal.fire({
              icon: 'success', title: 'Pesan Terkirim', text: 'Pesan peringatan telah dikirim ke kotak pesan anggota.',
              background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4'
            })
          }
          return;
        }
        throw new Error(data.message || 'Gagal mengubah jabatan')
      }
        
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Jabatan berhasil diperbarui.',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4',
        timer: 1500,
        showConfirmButton: false
      })
      fetchMembers()
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

  const handleRemove = async (userId) => {
    const result = await Swal.fire({
      title: 'Keluarkan Anggota?',
      text: "Tindakan ini tidak dapat dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, keluarkan!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/communities/${communityId}/members/${userId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal mengeluarkan anggota')
          
        Swal.fire({
          icon: 'success',
          title: 'Dikeluarkan!',
          text: 'Anggota telah dikeluarkan dari komunitas.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#06b6d4'
        })
        fetchMembers()
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

  const handleApproveApplicant = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${communityId}/applicants/${userId}/approve`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menerima pendaftar')
      
      Swal.fire({
        icon: 'success',
        title: 'Diterima!',
        text: 'Pendaftar telah menjadi anggota aktif.',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
      fetchMembers()
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Gagal', text: err.message,
        background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4'
      })
    }
  }

  const handleRejectApplicant = async (userId) => {
    const result = await Swal.fire({
      title: 'Tolak Pendaftar?',
      text: "Pendaftar akan dihapus dari daftar seleksi.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, tolak!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/communities/${communityId}/members/${userId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal menolak pendaftar')
        
        Swal.fire({
          icon: 'success', title: 'Ditolak!', text: 'Pendaftar telah ditolak.',
          background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4'
        })
        fetchMembers()
      } catch (err) {
        Swal.fire({
          icon: 'error', title: 'Gagal', text: err.message,
          background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4'
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

      exportMemberPDF(data)

      Swal.fire({
        icon: 'success',
        title: 'Ekspor Berhasil!',
        text: 'Laporan anggota berhasil diunduh sebagai file PDF.',
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'KETUA': return 'bg-amber-500/20 text-amber-300'
      case 'SEKRETARIS': return 'bg-blue-500/20 text-blue-300'
      case 'BENDAHARA': return 'bg-emerald-500/20 text-emerald-300'
      case 'KADIV': return 'bg-purple-500/20 text-purple-300'
      default: return 'bg-slate-700/40 text-slate-300'
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>

  return (
    <section className="mt-8">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Anggota Komunitas</h3>
            <p className="text-sm text-slate-500">Daftar anggota dan jabatan mereka dalam komunitas</p>
            {isReadOnly && <p className="text-xs text-amber-400 mt-2">📌 Mode Read-Only</p>}
          </div>
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
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead><tr className="text-left text-slate-400">
              <th className="pb-4 pr-6">Nama</th>
              <th className="pb-4 pr-6">Jabatan</th>
              <th className="pb-4 pr-6">Status</th>
              <th className="pb-4 pr-6">Bergabung</th>
              {!isReadOnly && currentUserRole === 'KETUA' && <th className="pb-4">Aksi</th>}
            </tr></thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">Belum ada anggota</td></tr>
              ) : members.map(member => (
                <tr key={member.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-4 pr-6 font-medium text-white">{member.nama}</td>
                  <td className="py-4 pr-6">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleColor(member.community_role)}`}>
                      {member.community_role}
                    </span>
                  </td>
                  <td className="py-4 pr-6">
                    <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-300">
                      {member.status_keanggotaan || 'AKTIF'}
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-slate-400">{member.joined_at ? new Date(member.joined_at).toLocaleDateString('id-ID') : '-'}</td>
                  {!isReadOnly && currentUserRole === 'KETUA' && member.community_role !== 'KETUA' && (
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <select onChange={(e) => { if (e.target.value) handleChangeRole(member.user_id, e.target.value) }} defaultValue=""
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white outline-none">
                          <option value="" disabled>Ubah Jabatan</option>
                          {['ANGGOTA','SEKRETARIS','BENDAHARA','KADIV'].filter(r => r !== member.community_role).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button onClick={() => handleRemove(member.user_id)} className="rounded-lg px-2 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Hapus</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isReadOnly && currentUserRole === 'KETUA' && (
        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Menunggu Seleksi</h3>
            <p className="text-sm text-slate-500">Daftar calon anggota yang ingin bergabung dengan komunitas ini.</p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead><tr className="text-left text-slate-400">
                <th className="pb-4 pr-6">Nama</th>
                <th className="pb-4 pr-6">Email</th>
                <th className="pb-4 pr-6">Tanggal Daftar</th>
                <th className="pb-4">Aksi</th>
              </tr></thead>
              <tbody>
                {applicants.length === 0 ? (
                  <tr><td colSpan="4" className="py-8 text-center text-slate-400">Belum ada pendaftar baru</td></tr>
                ) : applicants.map(app => (
                  <tr key={app.id} className="border-t border-slate-800 text-slate-200">
                    <td className="py-4 pr-6 font-medium text-white">{app.nama}</td>
                    <td className="py-4 pr-6 text-slate-400">{app.email}</td>
                    <td className="py-4 pr-6 text-slate-400">{app.joined_at ? new Date(app.joined_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApproveApplicant(app.id)} className="rounded-lg px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition">Terima</button>
                        <button onClick={() => handleRejectApplicant(app.id)} className="rounded-lg px-3 py-1 text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Tolak</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
