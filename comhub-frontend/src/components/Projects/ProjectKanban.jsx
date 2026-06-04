export default function ProjectKanban({
  taskBoard,
  projectMembers,
  currentUser,
  submissions,
  isKetuaOrSekretaris,
  setReviewModal,
  setReviewNote,
  downloadFile
}) {
  return (
    <>
      {/* 🚨 NOTIFIKASI TUGAS MENUNGGU PERSETUJUAN (KHUSUS KETUA/SEKRETARIS) */}
      {isKetuaOrSekretaris && submissions.filter(s => s.status === 'PENDING').length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-5 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <h5 className="text-base font-bold text-amber-300 mb-1">Tugas Menunggu Persetujuan</h5>
              <p className="text-xs text-slate-400 mb-4">
                Terdapat <span className="font-semibold text-amber-300">{submissions.filter(s => s.status === 'PENDING').length} tugas</span> yang telah dikumpulkan anggota dan membutuhkan persetujuan Anda agar masuk ke Portofolio mereka.
              </p>
              
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {submissions.filter(s => s.status === 'PENDING').map(sub => {
                  const allBoardTasks = [
                    ...(taskBoard?.board?.TODO || []),
                    ...(taskBoard?.board?.IN_PROGRESS || []),
                    ...(taskBoard?.board?.DONE || [])
                  ];
                  const relatedTask = allBoardTasks.find(t => t.id === sub.task_id);
                  return (
                    <div key={sub.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-white line-clamp-1">
                            {relatedTask ? relatedTask.judul_tugas : 'Tugas'}
                          </p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                            Menunggu
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Oleh: <strong className="text-slate-300 font-semibold">{sub.user_name}</strong> · {new Date(sub.submitted_at).toLocaleDateString('id-ID')}
                        </p>
                        {sub.notes && (
                          <p className="text-[11px] text-slate-400 bg-slate-950/40 rounded px-2 py-1 mt-2 border border-slate-900 italic">
                            "{sub.notes}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => downloadFile(sub.id, sub.file_name)}
                          className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 font-semibold transition border border-slate-700/50"
                        >
                          📁 Unduh File
                        </button>
                        <button
                          onClick={() => { setReviewModal(sub); setReviewNote('') }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-1.5 transition shadow-lg shadow-amber-500/10"
                        >
                          👍 Tinjau & Acc
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {['TODO', 'IN_PROGRESS', 'DONE'].map(col => (
          <div key={col} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${col === 'DONE' ? 'text-emerald-400' : col === 'IN_PROGRESS' ? 'text-blue-400' : 'text-slate-400'}`}>
              {col.replace('_', ' ')}
            </p>
            <div className="space-y-2">
              {(taskBoard?.board?.[col] || []).map(task => {
                const assignedMember = projectMembers.find(m => (m.user_id || m.id) === task.assigned_to)
                const isMyTask = currentUser && task.assigned_to === currentUser.id
                
                // Cari submission terkait tugas ini
                const taskSubs = submissions.filter(s => s.task_id === task.id)
                const pendingSub = taskSubs.find(s => s.status === 'PENDING')
                const latestSub = pendingSub || taskSubs[0]

                return (
                  <div key={task.id} className={`rounded-xl p-3.5 text-sm border transition-all duration-200 ${isMyTask ? 'bg-slate-800 border-cyan-500/30' : 'bg-slate-800/80 border-slate-750/50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white leading-tight">{task.judul_tugas}</p>
                      {latestSub && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          latestSub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          latestSub.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {latestSub.status === 'APPROVED' ? 'Selesai' : latestSub.status === 'REJECTED' ? 'Revisi' : 'Menunggu'}
                        </span>
                      )}
                    </div>
                    {task.deskripsi && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{task.deskripsi}</p>}
                    
                    {latestSub && latestSub.notes && (
                      <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 rounded p-1.5 border border-slate-800/80">
                        <span className="font-semibold text-slate-300">Catatan:</span> "{latestSub.notes}"
                      </div>
                    )}

                    {assignedMember && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                          👤 {assignedMember.nama}
                        </span>
                        {isMyTask && col !== 'DONE' && (
                          <span className="text-[10px] text-cyan-400">📝 Cek Portofolio</span>
                        )}
                      </div>
                    )}

                    {/* Tombol Acc langsung dari Kanban card jika user adalah Ketua/Sekretaris dan ada pending submission */}
                    {isKetuaOrSekretaris && pendingSub && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-1.5">
                        <button
                          onClick={() => downloadFile(pendingSub.id, pendingSub.file_name)}
                          className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 font-semibold transition border border-slate-600/30"
                        >
                          📁 Unduh File
                        </button>
                        <button
                          onClick={() => { setReviewModal(pendingSub); setReviewNote('') }}
                          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-1.5 transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                        >
                          👍 Acc / Tinjau Tugas
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {(taskBoard?.board?.[col] || []).length === 0 && <p className="text-xs text-slate-600 text-center py-2">Kosong</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Submissions review (Ketua/Sekretaris) */}
      {isKetuaOrSekretaris && submissions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h5 className="text-sm font-semibold text-white mb-3">
            Semua Riwayat Pengumpulan ({submissions.filter(s => s.status === 'PENDING').length} pending)
          </h5>
          <div className="space-y-2">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-white">{sub.user_name}</p>
                  <p className="text-xs text-slate-400">{sub.file_name} · {new Date(sub.submitted_at).toLocaleDateString('id-ID')}</p>
                  {sub.notes && <p className="text-xs text-slate-500 mt-0.5">Catatan: {sub.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sub.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : sub.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    {sub.status}
                  </span>
                  <button onClick={() => downloadFile(sub.id, sub.file_name)} className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600 transition">Unduh</button>
                  {sub.status === 'PENDING' && (
                    <button onClick={() => { setReviewModal(sub); setReviewNote('') }} className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">Tinjau</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
