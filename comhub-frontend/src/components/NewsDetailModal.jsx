export function NewsDetailModal({ isOpen, onClose, news }) {
  if (!isOpen || !news) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-xl w-full shadow-2xl shadow-cyan-500/5 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            {news.community_name || 'PENGUMUMAN RESMI'}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">✕</button>
        </div>
        
        <div className="overflow-y-auto mt-4 flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <h3 className="text-2xl font-bold text-white leading-snug">{news.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span>✍️ Oleh: <strong className="text-slate-300">{news.author_name || 'Admin'}</strong></span>
            <span>📅 Dipublikasikan: <strong className="text-slate-300">{new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>

          {news.image && (
            <div className="w-full aspect-video rounded-xl overflow-hidden my-4 border border-slate-800 bg-slate-950">
              <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="mt-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-800 flex justify-end mt-4">
          <button 
            onClick={onClose} 
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 text-sm font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
