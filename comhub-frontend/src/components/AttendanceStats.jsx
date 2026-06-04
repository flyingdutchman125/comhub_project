export function AttendanceStats({ stats }) {
    return (
        <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                <div>
                    <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                        Rata-Rata Kehadiran
                    </span>
                    <h4 className="text-slate-400 text-xs mt-3">Persentase kehadiran seluruh anggota</h4>
                </div>
                <div className="flex items-baseline mt-6">
                    <span className="text-4xl font-bold text-white">{stats.avgRate}%</span>
                    <span className="text-xs text-slate-500 ml-2">dari semua sesi</span>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                <div>
                    <span className="rounded-full bg-purple-500/10 text-purple-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                        Total Sesi Absensi
                    </span>
                    <h4 className="text-slate-400 text-xs mt-3">Sesi absensi kegiatan yang telah dibuat</h4>
                </div>
                <div className="flex items-baseline mt-6">
                    <span className="text-4xl font-bold text-white">{stats.totalSess}</span>
                    <span className="text-xs text-slate-500 ml-2">Sesi Kegiatan</span>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between shadow-xl shadow-cyan-500/5 hover:border-slate-700 transition duration-300">
                <div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                        Kehadiran Sempurna
                    </span>
                    <h4 className="text-slate-400 text-xs mt-3">Anggota dengan kehadiran 100%</h4>
                </div>
                <div className="flex items-baseline mt-6">
                    <span className="text-4xl font-bold text-white">{stats.perfectCount}</span>
                    <span className="text-xs text-slate-500 ml-2">Anggota</span>
                </div>
            </div>
        </div>
    );
}
