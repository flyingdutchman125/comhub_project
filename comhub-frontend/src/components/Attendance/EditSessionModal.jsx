import React from 'react';

export function EditSessionModal({
    showEditModal,
    setShowEditModal,
    formData,
    setFormData,
    handleEditSession,
    setEditingSession
}) {
    if (!showEditModal) return null;

    return (
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
    );
}
