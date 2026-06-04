import React from 'react';

export default function ReviewModal({
  reviewModal,
  reviewNote,
  setReviewNote,
  handleReview,
  setReviewModal
}) {
  if (!reviewModal) return null;

  return (
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
  );
}
