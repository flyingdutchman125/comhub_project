import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export function ApprovalPage({ token, userRole }) {
  const [pendingCommunities, setPendingCommunities] = useState([])
  const [pendingActivities, setPendingActivities] = useState({ projects: [], finances: [] })
  const [activeTab, setActiveTab] = useState('komunitas') // 'komunitas' | 'aktivitas'
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/communities/pending/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingCommunities(data)
      } else {
        const err = await res.json()
        Swal.fire('Error', err.message || 'Gagal memuat daftar persetujuan', 'error')
      }

      if (userRole === 'DOSEN') {
        const resAct = await fetch('http://localhost:3000/api/communities/pending/ukm-activities', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (resAct.ok) {
          const actData = await resAct.json()
          setPendingActivities(actData)
        }
      }
    } catch (error) {
      console.error('Error fetching pending data:', error)
      Swal.fire('Error', 'Gagal terhubung ke server', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApproveDosen = async (id) => {
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Catatan Kelayakan',
      text: 'Berikan penilaian kelayakan untuk komunitas ini sebelum di-ACC.',
      input: 'textarea',
      inputPlaceholder: 'Tuliskan catatan kelayakan di sini...',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal'
    })

    if (!isConfirmed) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/approve/dosen`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ eligibility_notes: notes })
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Komunitas disetujui. Menunggu SK Kemahasiswaan.', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleApproveUpgrade = async (id) => {
    const confirm = await Swal.fire({
      title: 'Setujui Upgrade UKM?',
      text: 'Komunitas ini telah lulus syarat otomatis dari sistem. Anda akan mengesahkan statusnya menjadi UKM dan menjadi Pembina.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sahkan',
      cancelButtonText: 'Batal'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/upgrade/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Komunitas resmi menjadi UKM!', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleSetInterviewDate = async (id) => {
    const { value: date, isConfirmed } = await Swal.fire({
      title: 'Atur Jadwal Wawancara',
      html: '<input type="datetime-local" id="swal-input1" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        return document.getElementById('swal-input1').value
      }
    })

    if (!isConfirmed || !date) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/interview`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ interview_date: date })
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Jadwal wawancara berhasil diatur', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleApproveKemahasiswaan = async (id) => {
    const { value: skNumber } = await Swal.fire({
      title: 'Terbitkan SK',
      input: 'text',
      inputLabel: 'Masukkan Nomor SK',
      inputPlaceholder: 'Contoh: SK/123/2026',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Nomor SK wajib diisi!'
        }
      }
    })

    if (!skNumber) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/approve/kemahasiswaan`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sk_number: skNumber })
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Komunitas resmi aktif di ComHub!', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleApproveUpgradeKemahasiswaan = async (id) => {
    const { value: skNumber } = await Swal.fire({
      title: 'Terbitkan SK UKM',
      input: 'text',
      inputLabel: 'Masukkan Nomor SK UKM',
      inputPlaceholder: 'Contoh: SK/UKM/123/2026',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Nomor SK wajib diisi!'
        }
      }
    })

    if (!skNumber) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/upgrade/approve/kemahasiswaan`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sk_number: skNumber })
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Komunitas resmi di-upgrade menjadi UKM!', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleRejectUpgradeKemahasiswaan = async (id) => {
    const confirm = await Swal.fire({
      title: 'Tolak Upgrade UKM?',
      text: 'Pengajuan upgrade ini akan ditolak.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/upgrade/reject/kemahasiswaan`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Pengajuan Upgrade telah ditolak', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleReject = async (id) => {
    const confirm = await Swal.fire({
      title: 'Tolak Komunitas?',
      text: 'Pengajuan komunitas ini akan ditolak secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await fetch(`http://localhost:3000/api/communities/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Komunitas telah ditolak', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleApproveActivity = async (type, id) => {
    try {
      const endpoint = type === 'project' ? `/api/communities/projects/${id}/approve` : `/api/communities/finances/${id}/approve`;
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Persetujuan berhasil diberikan', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  const handleRejectActivity = async (type, id) => {
    const confirm = await Swal.fire({
      title: 'Tolak Pengajuan?',
      text: 'Pengajuan ini akan ditolak.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Tolak'
    })

    if (!confirm.isConfirmed) return

    try {
      const endpoint = type === 'project' ? `/api/communities/projects/${id}/reject` : `/api/communities/finances/${id}/reject`;
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        Swal.fire('Berhasil', 'Pengajuan telah ditolak', 'success')
        fetchPending()
      } else {
        const err = await res.json()
        Swal.fire('Gagal', err.message, 'error')
      }
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan jaringan', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Persetujuan Menunggu</h2>
      </div>

      {userRole === 'DOSEN' && (
        <div className="flex gap-4 border-b border-slate-800 pb-2">
          <button 
            onClick={() => setActiveTab('komunitas')}
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'komunitas' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Pengajuan Komunitas & UKM
          </button>
          <button 
            onClick={() => setActiveTab('aktivitas')}
            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'aktivitas' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            Aktivitas UKM (Proyek & Dana)
            {(pendingActivities.projects.length + pendingActivities.finances.length) > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {pendingActivities.projects.length + pendingActivities.finances.length}
              </span>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
        </div>
      ) : activeTab === 'komunitas' ? (
        pendingCommunities.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">Tidak ada pengajuan komunitas yang perlu disetujui saat ini.</p>
          </div>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pendingCommunities.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{c.nama_komunitas}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-3">{c.deskripsi}</p>
                <div className="text-xs text-slate-500 mb-1">Diajukan oleh: <span className="text-slate-300 font-medium">{c.founder_name}</span></div>
                <div className="text-xs text-slate-500 mb-4">
                  Status: <span className="text-yellow-400 font-medium">
                    {c.upgrade_status === 'MENUNGGU_DOSEN' ? 'PENGAJUAN UPGRADE UKM' : 
                     c.upgrade_status === 'MENUNGGU_KEMAHASISWAAN' ? 'PENGESAHAN SK UKM' : 
                     c.approval_status.replace('_', ' ')}
                  </span>
                </div>
                {c.interview_date && c.upgrade_status !== 'MENUNGGU_DOSEN' && (
                  <div className="text-xs text-cyan-400 mb-4 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                    📅 Jadwal Wawancara: {new Date(c.interview_date).toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                {userRole === 'DOSEN' && c.upgrade_status !== 'MENUNGGU_DOSEN' && (
                  <>
                    <button 
                      onClick={() => handleSetInterviewDate(c.id)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm font-medium transition mb-2 border border-slate-700"
                    >
                      Jadwalkan Wawancara
                    </button>
                    <button 
                      onClick={() => handleApproveDosen(c.id)}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-2 text-sm font-medium transition"
                    >
                      ACC Wawancara
                    </button>
                  </>
                )}
                {userRole === 'DOSEN' && c.upgrade_status === 'MENUNGGU_DOSEN' && (
                  <>
                    <button 
                      onClick={() => handleApproveUpgrade(c.id)}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-2 text-sm font-medium transition"
                    >
                      Setujui Upgrade (Ke Kemahasiswaan)
                    </button>
                    {/* Note: Tolak button handling is omitted for Dosen upgrade since it was originally not fully implemented, falling back to handleReject for standard reject. */}
                    <button 
                      onClick={() => handleReject(c.id)}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                    >
                      Tolak
                    </button>
                  </>
                )}
                {userRole === 'KEMAHASISWAAN' && (
                  <>
                    {c.upgrade_status === 'MENUNGGU_KEMAHASISWAAN' ? (
                      <>
                        <button 
                          onClick={() => handleApproveUpgradeKemahasiswaan(c.id)}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-2 text-sm font-medium transition"
                        >
                          Terbitkan SK UKM
                        </button>
                        <button 
                          onClick={() => handleRejectUpgradeKemahasiswaan(c.id)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                        >
                          Tolak Upgrade
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleApproveKemahasiswaan(c.id)}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-2 text-sm font-medium transition"
                        >
                          Terbitkan SK
                        </button>
                        <button 
                          onClick={() => handleReject(c.id)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </>
                )}
                {userRole !== 'DOSEN' && userRole !== 'KEMAHASISWAAN' && (
                  <button 
                    onClick={() => handleReject(c.id)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition"
                  >
                    Tolak
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
        <div className="space-y-8">
          {/* Bagian Proyek */}
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-4">Pengajuan Proyek UKM</h3>
            {pendingActivities.projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Tidak ada pengajuan proyek.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingActivities.projects.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 mb-1">{p.nama_komunitas}</div>
                      <h4 className="text-lg font-bold text-slate-200">{p.nama_proker}</h4>
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{p.deskripsi}</p>
                      <div className="text-xs text-slate-300 mt-3 p-2 bg-slate-900 rounded border border-slate-700">
                        Anggaran: Rp {parseInt(p.anggaran).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleApproveActivity('project', p.id)} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-1.5 rounded-lg text-sm">Setujui</button>
                      <button onClick={() => handleRejectActivity('project', p.id)} className="flex-1 bg-slate-700 hover:bg-red-500 hover:text-white text-slate-300 font-bold py-1.5 rounded-lg text-sm">Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian Pendanaan */}
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-4">Pengajuan Pencairan Dana UKM</h3>
            {pendingActivities.finances.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Tidak ada pengajuan dana.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingActivities.finances.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 mb-1">{f.nama_komunitas}</div>
                      <h4 className="text-lg font-bold text-slate-200">Dana {f.type === 'INCOME' ? 'Masuk' : 'Keluar'}</h4>
                      <p className="text-sm text-slate-400 mt-2">{f.description}</p>
                      <div className="text-xs font-mono text-slate-300 mt-3 p-2 bg-slate-900 rounded border border-slate-700">
                        Nominal: Rp {parseInt(f.amount).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleApproveActivity('finance', f.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-1.5 rounded-lg text-sm">Setujui</button>
                      <button onClick={() => handleRejectActivity('finance', f.id)} className="flex-1 bg-slate-700 hover:bg-red-500 hover:text-white text-slate-300 font-bold py-1.5 rounded-lg text-sm">Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
