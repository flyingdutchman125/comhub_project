import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import CropModal from './CropModal'

export function CommunityNewsPage({ communityId, token, communityName }) {
  const [newsList, setNewsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [selectedNews, setSelectedNews] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', image: '' })
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const cropCallbackRef = useRef(null)

  const fetchNews = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3000/api/news?communityId=${communityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Gagal mengambil berita komunitas')
      const data = await res.json()
      setNewsList(data)
    } catch (err) {
      console.error('Error fetching community news:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [communityId])

  const handleImageChange = (e, callback) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'File tidak valid', text: 'Silakan pilih file gambar.', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setCropSrc(event.target.result)
      cropCallbackRef.current = callback
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Judul dan isi berita harus diisi!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      return
    }

    try {
      const url = editingNews 
        ? `http://localhost:3000/api/news/${editingNews.id}` 
        : 'http://localhost:3000/api/news'
      const method = editingNews ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          community_id: communityId
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal memproses berita')

      Swal.fire({
        icon: 'success',
        title: editingNews ? 'Berita diperbarui!' : 'Berita dipublikasikan!',
        text: data.message,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4',
        timer: 1500,
        showConfirmButton: false
      })

      setShowFormModal(false)
      setFormData({ title: '', content: '', image: '' })
      setEditingNews(null)
      fetchNews()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    }
  }

  const handleDelete = async (newsId) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Berita ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/news/${newsId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal menghapus berita')

        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Berita telah dihapus.',
          background: '#0f172a',
          color: '#fff',
          timer: 1500,
          showConfirmButton: false
        })
        fetchNews()
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      }
    }
  }

  const handleEditClick = (newsItem) => {
    setEditingNews(newsItem)
    setFormData({ title: newsItem.title, content: newsItem.content, image: newsItem.image || '' })
    setShowFormModal(true)
  }

  const handleOpenDetail = (newsItem) => {
    setSelectedNews(newsItem)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Kelola Berita Komunitas</h2>
          <p className="text-sm text-slate-400">Publikasikan informasi dan pengumuman untuk komunitas <strong className="text-cyan-400">{communityName}</strong></p>
        </div>
        <button
          onClick={() => { setEditingNews(null); setFormData({ title: '', content: '', image: '' }); setShowFormModal(true) }}
          className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 font-bold transition self-start sm:self-auto shadow-lg shadow-cyan-500/10"
        >
          + Tambah Berita
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin" />
        </div>
      ) : newsList.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">Belum ada berita yang diunggah oleh komunitas ini.</p>
          <button
            onClick={() => { setEditingNews(null); setFormData({ title: '', content: '', image: '' }); setShowFormModal(true) }}
            className="mt-4 text-sm text-cyan-400 hover:underline font-semibold"
          >
            Mulai buat berita pertama Anda
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {newsList.map((news) => (
            <div 
              key={news.id} 
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    {news.community_name || 'Berita'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {news.image && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 border border-slate-800 bg-slate-950 cursor-pointer" onClick={() => handleOpenDetail(news)}>
                    <img src={news.image} alt={news.title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                  </div>
                )}
                <h3 
                  onClick={() => handleOpenDetail(news)}
                  className="text-lg font-bold text-white hover:text-cyan-300 cursor-pointer transition line-clamp-1"
                >
                  {news.title}
                </h3>
                <p className="text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {news.content}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">✍️ Oleh: <strong className="text-slate-400">{news.author_name}</strong></span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleEditClick(news)} 
                    className="text-slate-400 hover:text-cyan-400 text-sm transition"
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(news.id)} 
                    className="text-slate-400 hover:text-red-400 text-sm transition"
                    title="Hapus"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-lg w-full shadow-2xl shadow-cyan-500/5 max-h-[90vh] flex flex-col">
            <h3 className="text-2xl font-bold text-white">{editingNews ? 'Edit Berita Komunitas' : 'Tambah Berita Komunitas'}</h3>
            <p className="mt-2 text-slate-400 text-sm">Publikasikan informasi resmi atau pengumuman divisi Anda ke mahasiswa.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Judul Berita</label>
                <input 
                  type="text" 
                  required
                  value={formData.title} 
                  onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 transition" 
                  placeholder="Masukkan judul menarik" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gambar Berita (Rasio 16:9)</label>
                <div className="flex flex-col gap-3">
                  {formData.image ? (
                    <div className="relative rounded-xl border border-slate-700 bg-slate-950 overflow-hidden aspect-video w-full max-w-sm">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, image: '' }))}
                        className="absolute top-2 right-2 rounded-full bg-red-600/80 text-white p-1.5 hover:bg-red-600 transition"
                        title="Hapus Gambar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition group">
                      <span className="text-3xl mb-2 group-hover:scale-110 transition duration-200">🖼️</span>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 transition">Pilih Gambar Berita</span>
                      <span className="text-[10px] text-slate-500 mt-1">Akan otomatis di-crop ke rasio 16:9</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageChange(e, (base64) => setFormData(p => ({ ...p, image: base64 })))} 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Isi Berita</label>
                <textarea 
                  required 
                  rows="6"
                  value={formData.content} 
                  onChange={(e) => setFormData(p => ({...p, content: e.target.value}))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 transition resize-none" 
                  placeholder="Tuliskan detail pengumuman atau berita secara lengkap di sini..." 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  {editingNews ? 'Simpan' : 'Publikasikan'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)} 
                  className="flex-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2.5 font-bold transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Modal for image cropping */}
      {showCropModal && cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onCancel={() => {
            setShowCropModal(false);
            setCropSrc(null);
          }}
          onCropDone={(cropped) => {
            setFormData((p) => ({ ...p, image: cropped }));
            setShowCropModal(false);
            setCropSrc(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNews && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowDetailModal(false)}>
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-xl w-full shadow-2xl shadow-cyan-500/5 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {selectedNews.community_name || 'Berita Komunitas'}
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
