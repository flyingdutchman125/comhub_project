import { useState, useRef } from 'react'
import Swal from 'sweetalert2'

export function NewsFormModal({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) {
  if (!isOpen) return null

  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const cropCallbackRef = useRef(null)

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
      setShowCropModal(true) // Crop modal is not fully hooked up here without the CropModal component itself, but this keeps original logic
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-lg w-full shadow-2xl shadow-cyan-500/5 max-h-[90vh] flex flex-col">
        <h3 className="text-2xl font-bold text-white">{isEditing ? 'Edit Berita Terkini' : 'Tambah Berita Terkini'}</h3>
        <p className="mt-2 text-slate-400 text-sm">Publikasikan informasi atau pengumuman resmi ke seluruh mahasiswa dan dosen.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
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
              {isEditing ? 'Simpan' : 'Publikasikan'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2.5 font-bold transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
