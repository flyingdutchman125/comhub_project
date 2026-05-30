export function CommunityCard({ community, onSelect }) {
  return (
    <button
      onClick={() => onSelect(community)}
      className="text-left rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80 transition overflow-hidden group cursor-pointer h-full relative flex flex-col"
    >
      <div 
        className="h-24 relative shrink-0 overflow-visible bg-slate-900"
        style={community.logo ? { backgroundImage: `url(${community.logo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {community.logo ? (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-slate-950 group-hover:from-cyan-500/30 group-hover:via-blue-500/30 transition" />
        )}
        
        {community.logo && (
          <img src={community.logo} alt="Logo" className="absolute -bottom-6 left-6 h-16 w-16 rounded-full border-4 border-slate-950 object-cover bg-slate-800 z-10 shadow-lg" />
        )}
      </div>
      <div className={`p-6 flex-1 flex flex-col ${community.logo ? 'pt-8' : ''}`}>
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition line-clamp-1">
          {community.name || community.nama_komunitas}
        </h3>
        <p className="mt-2 text-sm text-slate-400 line-clamp-2 flex-1">
          {community.description || community.deskripsi}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-400">{community.memberCount || 0} Anggota</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1">
            <span className="text-amber-400 text-xs">⭐</span>
            <span className="text-xs font-bold text-slate-200">{Number(community.avgRating || 0).toFixed(1)}</span>
            <span className="text-[10px] text-slate-500">({community.reviewCount || 0})</span>
          </div>
        </div>
        <button
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 transition border border-cyan-500/30"
          onClick={(e) => { e.stopPropagation(); onSelect(community) }}
        >
          Lihat Detail →
        </button>
      </div>
    </button>
  )
}
