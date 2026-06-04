import React from 'react';

export default function TaskFormModal({
  showTaskForm,
  selectedProject,
  taskForm,
  setTaskForm,
  handleCreateTask,
  setShowTaskForm,
  projectMembers
}) {
  if (!showTaskForm || !selectedProject) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-1">Bagi Tugas</h3>
        <p className="text-sm text-slate-400 mb-5">Proyek: {selectedProject.name}</p>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Judul Tugas</label>
            <input required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
              value={taskForm.judul_tugas} onChange={e => setTaskForm(p => ({ ...p, judul_tugas: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Deskripsi Tugas</label>
            <textarea rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
              value={taskForm.deskripsi} onChange={e => setTaskForm(p => ({ ...p, deskripsi: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tugaskan ke Anggota</label>
            <select required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-400"
              value={taskForm.assigned_to} onChange={e => setTaskForm(p => ({ ...p, assigned_to: e.target.value }))}>
              <option value="">-- Pilih Anggota --</option>
              {projectMembers.map(m => (
                <option key={m.user_id || m.id} value={m.user_id || m.id}>{m.nama} ({m.community_role})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-lg bg-purple-500 py-2 font-semibold text-white hover:bg-purple-400 transition">Bagi Tugas</button>
            <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800 transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
