export default function TopCommunities({ topCommunities, setSelectedCommunity, setShowDetailPage }) {
  if (!topCommunities || topCommunities.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 relative overflow-hidden shadow-lg shadow-cyan-500/5 mb-6">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <span className="text-8xl">🏆</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xl">
            🔥
          </span>
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Top Komunitas Berprestasi</h3>
            <p className="text-xs text-slate-400">Paling banyak menyelesaikan proyek</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {topCommunities.map((c, index) => (
            <div key={c.id} className="flex-1 min-w-[200px] flex items-center gap-4 rounded-2xl bg-slate-800/50 p-4 border border-slate-700/50 hover:border-cyan-500/50 transition cursor-pointer"
              onClick={() => { setSelectedCommunity(c); setShowDetailPage(true) }}>
              <div className="relative flex-shrink-0">
                {c.logo ? (
                  <img src={c.logo} alt={c.nama_komunitas} className="h-12 w-12 rounded-full object-cover border border-slate-700" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-slate-950">
                    {c.nama_komunitas.charAt(0)}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-slate-900 border-2 border-slate-900">
                  #{index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{c.nama_komunitas}</h4>
                <p className="text-xs text-cyan-400 font-medium">{c.completedProjects ?? c.completed_projects} Proyek Selesai</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
