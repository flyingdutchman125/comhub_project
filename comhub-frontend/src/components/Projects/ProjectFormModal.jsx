import React from 'react';

export default function ProjectFormModal({
  showForm,
  isReadOnly,
  editingId,
  formData,
  setFormData,
  handleSubmit,
  setShowForm
}) {
  if (!showForm || isReadOnly) return null;

  return (
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
  );
}
