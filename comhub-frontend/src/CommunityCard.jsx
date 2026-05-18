export function CommunityCard({ community, onSelect }) {
  return (
    <button
      onClick={() => onSelect(community)}
      className="text-left rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80 transition overflow-hidden group cursor-pointer h-full"
    >
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-slate-950 group-hover:from-cyan-500/30 group-hover:via-blue-500/30 transition" />
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition">
          {community.name}
        </h3>
        
        <p className="mt-2 text-sm text-slate-400 line-clamp-2">
          {community.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-400">Anggota</span>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {community.members}
          </span>
        </div>

        <button
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-sm font-medium text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 transition border border-cyan-500/30"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(community)
          }}
        >
          Lihat Detail →
        </button>
      </div>
    </button>
  )
}
