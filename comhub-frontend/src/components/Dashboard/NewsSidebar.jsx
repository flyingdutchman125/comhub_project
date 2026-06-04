export default function NewsSidebar({
  user,
  setEditingNews,
  setNewsFormData,
  setShowNewsModal,
  loadingNews,
  newsList,
  handleOpenNewsDetail,
  getCommunityRole,
  handleEditNewsClick,
  handleDeleteNews
}) {
  return (
    <aside className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 flex flex-col max-h-[550px]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-semibold text-white">Berita Terkini</h3>
          <p className="text-xs text-slate-500">Informasi & pengumuman kampus</p>
        </div>
        {user?.role === 'KEMAHASISWAAN' && (
          <button 
            onClick={() => { setEditingNews(null); setNewsFormData({ title: '', content: '' }); setShowNewsModal(true) }}
            className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 text-xs transition cursor-pointer"
          >
            + Tambah
          </button>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {loadingNews ? (
          <div className="flex justify-center py-8"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>
        ) : (!newsList || newsList.length === 0) ? (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">Belum ada berita terbaru.</p>
          </div>
        ) : (
          newsList.map((news) => (
            <div 
              key={news.id} 
              onClick={() => handleOpenNewsDetail(news)}
              className="group relative rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700 transition cursor-pointer duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {news.community_name || 'Info Kampus'}
                </span>
                <span className="text-[10px] text-slate-500">{new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition duration-200 line-clamp-1">{news.title}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{news.content}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">✍️ {news.author_name || 'Admin'}</p>
                {(user?.role === 'KEMAHASISWAAN' || (news.community_id && typeof getCommunityRole === 'function' && ['KETUA', 'KADIV'].includes(getCommunityRole(news.community_id)))) && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEditNewsClick(news)} className="text-slate-400 hover:text-cyan-400 text-xs transition cursor-pointer" title="Edit">✏️</button>
                    <button onClick={() => handleDeleteNews(news.id)} className="text-slate-400 hover:text-red-400 text-xs transition cursor-pointer" title="Hapus">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
