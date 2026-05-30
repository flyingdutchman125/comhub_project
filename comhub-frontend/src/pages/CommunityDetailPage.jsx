import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import Swal from 'sweetalert2'

export function CommunityDetailPage({ community, onBack }) {
  const { token, refreshMemberships } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNews, setSelectedNews] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [reviewsData, setReviewsData] = useState({ userReview: null, reviews: [] })
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Fetch data real dari API
  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${community.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Gagal mengambil data komunitas')
      const data = await res.json()
      setDetail(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [community.id, token])

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${community.id}/reviews`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setReviewsData(data)
        if (data.userReview) {
          setReviewFormData({ rating: data.userReview.rating, comment: data.userReview.comment || '' })
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err)
    }
  }, [community.id, token])

  useEffect(() => {
    fetchDetail()
    fetchReviews()
  }, [fetchDetail, fetchReviews])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingReview(true)
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${community.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewFormData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulasan')
      
      Swal.fire({ title: 'Berhasil', text: data.message, icon: 'success', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      fetchReviews()
      fetchDetail()
    } catch (err) {
      Swal.fire({ title: 'Gagal', text: err.message, icon: 'error', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleJoinCommunity = async () => {
    setIsJoining(true)
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${community.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mendaftar')
      
      // Update global state & refresh detail
      await refreshMemberships()
      await fetchDetail()
      Swal.fire('Berhasil', 'Pendaftaran Anda berhasil dikirim dan sedang menunggu seleksi.', 'success')
    } catch (err) {
      console.error('Join error', err)
      Swal.fire({
        title: 'Gagal Bergabung',
        text: err.message,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleUpgradeUKM = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${detail.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      
      if (!res.ok) {
        if (data.checklist) {
          const { isOldEnough, isAttendanceGood, attendancePercentage, isFinanciallyHealthy, hasEnoughProjects, projectCount } = data.checklist
          Swal.fire({
            title: 'Syarat Upgrade Belum Terpenuhi',
            html: `
              <div class="text-left text-sm space-y-2 mt-4">
                <p>${isOldEnough ? '✅' : '❌'} <b>Umur Komunitas:</b> ${isOldEnough ? 'Minimal 3 tahun (Terpenuhi)' : 'Harus minimal 3 tahun'}</p>
                <p>${isAttendanceGood ? '✅' : '❌'} <b>Absensi Anggota:</b> ${attendancePercentage} ${isAttendanceGood ? '(Terpenuhi)' : '(Minimal 80% dalam 3 tahun)'}</p>
                <p>${isFinanciallyHealthy ? '✅' : '❌'} <b>Kesehatan Keuangan:</b> ${isFinanciallyHealthy ? 'Pemasukan > Pengeluaran (Terpenuhi)' : 'Pemasukan harus lebih besar dari pengeluaran'}</p>
                <p>${hasEnoughProjects ? '✅' : '❌'} <b>Program Kerja Terlaksana:</b> ${projectCount} proyek ${hasEnoughProjects ? '(Terpenuhi)' : '(Minimal 3 proyek selesai dalam 3 tahun)'}</p>
              </div>
            `,
            icon: 'warning',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#06b6d4'
          })
          return
        }
        throw new Error(data.message || 'Gagal mengajukan upgrade')
      }

      Swal.fire({
        title: 'Berhasil!',
        text: data.message || 'Pengajuan UKM berhasil dikirim dan menunggu persetujuan Dosen!',
        icon: 'success',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
      fetchDetail()
    } catch (err) {
      Swal.fire({
        title: 'Gagal Mengajukan',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4'
      })
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

  const getDuration = (startDate) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'baru saja dibuat';
    if (diffDays < 30) return `${diffDays} hari`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} bulan`;
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return `${diffYears} tahun${remainingMonths > 0 ? ` ${remainingMonths} bulan` : ''}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b1b] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin mx-auto" />
          <p className="text-slate-400">Memuat detail komunitas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060b1b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onBack} className="text-cyan-400 hover:text-cyan-300">← Kembali</button>
        </div>
      </div>
    )
  }

  const members = detail?.members || []
  const projects = detail?.projects || []
  const news = detail?.news || []
  const financial = detail?.financial || { totalBudget: 0, spent: 0, remaining: 0, transactions: [] }
  const hasJoined = detail?.isMember || false
  const joinStatus = detail?.joinStatus

  return (
    <div className="min-h-screen bg-[#060b1b]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition">
                ← Kembali
              </button>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
                {detail?.name}
                {detail?.status === 'UKM' && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                    UKM Resmi
                  </span>
                )}
                {detail?.avgRating !== undefined && (
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-base ml-2 border border-slate-700">
                    <span className="text-amber-400">⭐</span>
                    <span className="font-bold text-slate-200">{Number(detail.avgRating).toFixed(1)}</span>
                    <span className="text-xs text-slate-500">({detail.reviewCount})</span>
                  </div>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {detail?.created_at && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/20">
                    <span>🚀 Berjalan selama {getDuration(detail.created_at)}</span>
                  </div>
                )}
                {detail?.userRole === 'KETUA' && detail?.status === 'KOMUNITAS' && detail?.upgrade_status === 'TIDAK_ADA' && (
                  <button onClick={handleUpgradeUKM} className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-400 border border-purple-500/20 transition cursor-pointer">
                    ✨ Ajukan Menjadi UKM
                  </button>
                )}
                {detail?.upgrade_status === 'MENUNGGU_DOSEN' && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                    ⏳ Menunggu Pengesahan UKM
                  </div>
                )}
              </div>
              <p className="mt-3 text-slate-400 max-w-2xl">{detail?.description}</p>
            </div>
            {!hasJoined && joinStatus !== 'MENUNGGU_SELEKSI' && (
              <button onClick={handleJoinCommunity} disabled={isJoining}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 h-fit transition">
                {isJoining ? 'Sedang bergabung...' : 'Bergabung dengan Komunitas'}
              </button>
            )}
            {joinStatus === 'MENUNGGU_SELEKSI' && (
              <div className="rounded-xl bg-amber-500/20 border border-amber-500/30 px-6 py-3 h-fit">
                <p className="text-sm font-semibold text-amber-300">⏳ Menunggu seleksi</p>
              </div>
            )}
            {hasJoined && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 h-fit">
                <p className="text-sm font-semibold text-emerald-300">✓ Anda sudah bergabung ({detail?.userRole})</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Berita Komunitas */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">📢 Berita & Pengumuman</h2>
                  <p className="mt-1 text-slate-400">Kabar terbaru dan pengumuman resmi dari pengurus</p>
                </div>
              </div>
              <div className="space-y-4">
                {news.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Belum ada berita atau pengumuman</p>
                ) : (
                  news.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition duration-200 flex flex-col md:flex-row gap-4">
                      {item.image && (
                        <div 
                          onClick={() => { setSelectedNews(item); setShowDetailModal(true); }}
                          className="w-full md:w-48 aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0 cursor-pointer"
                        >
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <h3 
                            onClick={() => { setSelectedNews(item); setShowDetailModal(true); }}
                            className="font-bold text-white text-lg hover:text-cyan-300 cursor-pointer transition line-clamp-1"
                          >
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>✍️ Oleh: <strong className="text-slate-400">{item.author_name}</strong></span>
                          <button 
                            onClick={() => { setSelectedNews(item); setShowDetailModal(true); }}
                            className="text-cyan-400 hover:underline font-semibold"
                          >
                            Baca Selengkapnya →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Project Tracking */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">📊 Project Tracking</h2>
                <p className="mt-1 text-slate-400">Program kerja yang sedang berjalan dalam komunitas</p>
              </div>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Belum ada proyek</p>
                ) : projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{project.name || project.nama_proyek}</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {project.start_date && `${new Date(project.start_date).toLocaleDateString('id-ID')} - `}
                          {project.end_date && new Date(project.end_date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    {project.deskripsi && <p className="text-sm text-slate-400 mb-3">{project.deskripsi}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Financial */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">💰 Keuangan</h2>
                <p className="mt-1 text-slate-400">Ringkasan anggaran dan transaksi komunitas</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Anggaran</p>
                  <p className="text-2xl font-bold text-white">Rp {financial.totalBudget.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Terpakai</p>
                  <p className="text-2xl font-bold text-red-400">Rp {financial.spent.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Sisa</p>
                  <p className="text-2xl font-bold text-emerald-400">Rp {financial.remaining.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Riwayat Transaksi</h3>
                <div className="space-y-2">
                  {financial.transactions.length === 0 ? (
                    <p className="text-center text-slate-400 py-4">Belum ada transaksi</p>
                  ) : financial.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div>
                        <p className="text-sm font-medium text-white">{tx.description}</p>
                        <p className="text-xs text-slate-400">{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('id-ID') : ''}</p>
                      </div>
                      <p className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Ulasan & Rating Komunitas */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">⭐ Ulasan & Rating</h2>
                <p className="mt-1 text-slate-400">Apa kata anggota tentang komunitas ini</p>
              </div>

              {hasJoined && joinStatus === 'AKTIF' && (
                <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                  <h3 className="text-lg font-semibold text-white mb-3">{reviewsData.userReview ? 'Ulasan Anda' : 'Beri Ulasan'}</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                            className={`text-2xl transition hover:scale-110 ${star <= reviewFormData.rating ? 'text-amber-400' : 'text-slate-600'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Komentar (Opsional)</label>
                      <textarea
                        value={reviewFormData.comment}
                        onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        rows={3}
                        placeholder="Bagikan pengalaman Anda di komunitas ini..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Menyimpan...' : (reviewsData.userReview ? 'Perbarui Ulasan' : 'Kirim Ulasan')}
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {reviewsData.reviews.length === 0 && !reviewsData.userReview ? (
                  <p className="text-center text-slate-400 py-4">Belum ada ulasan</p>
                ) : (
                  [...(reviewsData.userReview ? [reviewsData.userReview] : []), ...reviewsData.reviews].map((review, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-white">
                            {review.nama} {review.user_id === reviewsData.userReview?.user_id && <span className="text-xs text-cyan-400 font-normal ml-1">(Anda)</span>}
                          </p>
                          <div className="flex text-amber-400 text-sm">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(review.updated_at || review.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {review.comment && <p className="text-slate-300 text-sm mt-2">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Members */}
          <aside>
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10 sticky top-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">👥 Anggota</h2>
                <p className="mt-1 text-sm text-slate-400">{members.length} anggota aktif</p>
              </div>
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">Belum ada anggota</p>
                ) : members.map((member) => (
                  <div key={member.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white text-sm">{member.nama}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Bergabung: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getRoleColor(member.community_role)}`}>
                        {member.community_role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* News Detail Modal */}
      {showDetailModal && selectedNews && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowDetailModal(false)}>
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-xl w-full shadow-2xl shadow-cyan-500/5 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Berita Komunitas
              </span>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white transition text-lg">✕</button>
            </div>
            
            <div className="overflow-y-auto mt-4 flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              <h3 className="text-2xl font-bold text-white leading-snug">{selectedNews.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span>✍️ Oleh: <strong className="text-slate-300">{selectedNews.author_name}</strong></span>
                <span>📅 Dipublikasikan: <strong className="text-slate-300">{new Date(selectedNews.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
              </div>
              
              {selectedNews.image && (
                <div className="w-full aspect-video rounded-xl overflow-hidden my-4 border border-slate-800 bg-slate-950">
                  <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNews.content}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-800 flex justify-end mt-4">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 text-sm font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
