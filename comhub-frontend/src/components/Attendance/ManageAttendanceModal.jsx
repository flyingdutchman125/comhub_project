import React from 'react';

export function ManageAttendanceModal({
    showManageModal,
    setShowManageModal,
    selectedSession,
    setSelectedSession,
    manageRecords,
    setManageRecords,
    isReadOnly,
    isKetuaOrSekretaris,
    handleRecordStatusChange,
    handleRecordNotesChange,
    handleSaveRecords,
    savingRecords,
    getStatusClass
}) {
    if (!showManageModal || !selectedSession) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-4xl w-full shadow-2xl max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-start pb-4 border-b border-slate-800 mb-4">
                    <div>
                        <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            Sesi Absensi: {new Date(selectedSession.session_date).toLocaleDateString('id-ID')}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2">{selectedSession.title}</h3>
                        <p className="text-slate-400 text-xs mt-1">{selectedSession.description || 'Tidak ada keterangan tambahan'}</p>
                    </div>
                    <button 
                        onClick={() => { setShowManageModal(false); setSelectedSession(null); setManageRecords([]) }} 
                        className="text-slate-400 hover:text-white transition text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* List/Table in Modal */}
                <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-800/80 pb-2">
                                <th className="pb-3 pr-4 font-semibold">Nama Anggota</th>
                                <th className="pb-3 pr-4 font-semibold">Status Kehadiran</th>
                                <th className="pb-3 font-semibold">Catatan Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manageRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="py-12 text-center text-slate-500">
                                        Tidak ada rekaman absensi ditemukan
                                    </td>
                                </tr>
                            ) : (
                                manageRecords.map(rec => (
                                    <tr key={rec.user_id} className="border-b border-slate-800/40 text-slate-300">
                                        <td className="py-3 pr-4 font-medium text-white">
                                            <div>
                                                <p className="font-semibold">{rec.nama}</p>
                                                <p className="text-[10px] text-slate-500">{rec.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4">
                                            {!isReadOnly && isKetuaOrSekretaris ? (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {['HADIR', 'SAKIT', 'IZIN', 'ALFA'].map(st => (
                                                        <button
                                                            key={st}
                                                            type="button"
                                                            onClick={() => handleRecordStatusChange(rec.user_id, st)}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                                                                rec.status === st
                                                                    ? st === 'HADIR' ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300'
                                                                        : st === 'SAKIT' ? 'bg-blue-500/25 border-blue-500 text-blue-300'
                                                                        : st === 'IZIN' ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                                                                        : 'bg-rose-500/25 border-rose-500 text-rose-300'
                                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                                            }`}
                                                        >
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(rec.status)}`}>
                                                    {rec.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            {!isReadOnly && isKetuaOrSekretaris ? (
                                                <input 
                                                    type="text" 
                                                    value={rec.notes || ''}
                                                    placeholder="Opsional (misal alasan sakit, dll)"
                                                    onChange={(e) => handleRecordNotesChange(rec.user_id, e.target.value)}
                                                    className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-cyan-500 transition w-full max-w-xs"
                                                />
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    {rec.notes || '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Save Action */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-4">
                    <button 
                        onClick={() => { setShowManageModal(false); setSelectedSession(null); setManageRecords([]) }} 
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 text-xs font-semibold transition"
                    >
                        Tutup
                    </button>
                    {!isReadOnly && isKetuaOrSekretaris && (
                        <button 
                            onClick={handleSaveRecords}
                            disabled={savingRecords}
                            className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2 text-xs font-bold transition disabled:opacity-50"
                        >
                            {savingRecords ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
