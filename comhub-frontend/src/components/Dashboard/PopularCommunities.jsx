export default function PopularCommunities({ popularCommunities, setSelectedCommunity, setShowDetailPage }) {
  if (!popularCommunities || popularCommunities.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 relative overflow-hidden shadow-lg shadow-emerald-500/5 mb-6">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <span className="text-8xl">📈</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xl">
            🚀
          </span>
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Terpopuler Minggu Ini</h3>
            <p className="text-xs text-slate-400">Komunitas dengan kunjungan detail tertinggi minggu ini</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {popularCommunities.map((c, index) => (
            <div key={c.id} className="flex-1 min-w-[200px] flex items-center gap-4 rounded-2xl bg-slate-800/50 p-4 border border-slate-700/50 hover:border-emerald-500/50 transition cursor-pointer"
              onClick={() => { setSelectedCommunity(c); setShowDetailPage(true) }}>
              <div className="relative flex-shrink-0">
                {c.logo ? (
                  <img src={c.logo} alt={c.name || c.nama_komunitas} className="h-12 w-12 rounded-full object-cover border border-slate-700" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-slate-950">
                    {(c.name || c.nama_komunitas || '').charAt(0)}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 border-2 border-slate-900">
                  #{index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{c.name || c.nama_komunitas}</h4>
                <p className="text-xs text-emerald-400 font-medium">{c.visitCount} Kunjungan</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
