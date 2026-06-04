import DashboardStats from '../components/Dashboard/DashboardStats'
import TopCommunities from '../components/Dashboard/TopCommunities'
import PopularCommunities from '../components/Dashboard/PopularCommunities'
import NewsSidebar from '../components/Dashboard/NewsSidebar'
import { CommunityCard } from '../components/CommunityCard'

export function DashboardPage({
  stats,
  topCommunities,
  popularCommunities,
  newsList,
  communities,
  filteredCommunities,
  loadingCommunities,
  loadingNews,
  currentPage,
  setCurrentPage,
  setShowCreateModal,
  user,
  setSelectedCommunity,
  setShowDetailPage,
  setEditingNews,
  setNewsFormData,
  setShowNewsModal,
  handleOpenNewsDetail,
  getCommunityRole,
  handleEditNewsClick,
  handleDeleteNews
}) {
  return (
    <>
      <DashboardStats stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="flex flex-col gap-6">
          <TopCommunities 
            topCommunities={topCommunities} 
            setSelectedCommunity={setSelectedCommunity} 
            setShowDetailPage={setShowDetailPage} 
          />
          
          <PopularCommunities 
            popularCommunities={popularCommunities} 
            setSelectedCommunity={setSelectedCommunity} 
            setShowDetailPage={setShowDetailPage} 
          />

          {/* Daftar Komunitas */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Daftar Komunitas</h3>
                <p className="text-sm text-slate-500">Pilih komunitas untuk mengelola</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{communities.length} Komunitas</span>
            </div>
            {loadingCommunities ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" /></div>
            ) : communities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400">Belum ada komunitas</p>
                {user?.role !== 'KEMAHASISWAAN' && user?.role !== 'DOSEN' && (
                  <button onClick={() => setShowCreateModal(true)} className="mt-4 rounded-lg bg-cyan-500/20 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-500/30 transition">
                    Buat Komunitas Pertama Anda
                  </button>
                )}
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400">Tidak ada komunitas yang sesuai dengan pencarian Anda.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredCommunities.slice((currentPage - 1) * 6, currentPage * 6).map((c) => (
                    <CommunityCard key={c.id} community={c} onSelect={(comm) => { setSelectedCommunity(comm); setShowDetailPage(true) }} />
                  ))}
                </div>
                {Math.ceil(filteredCommunities.length / 6) > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: Math.ceil(filteredCommunities.length / 6) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-full text-sm font-semibold transition ${currentPage === i + 1 ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <NewsSidebar 
          user={user}
          setEditingNews={setEditingNews}
          setNewsFormData={setNewsFormData}
          setShowNewsModal={setShowNewsModal}
          loadingNews={loadingNews}
          newsList={newsList}
          handleOpenNewsDetail={handleOpenNewsDetail}
          getCommunityRole={getCommunityRole}
          handleEditNewsClick={handleEditNewsClick}
          handleDeleteNews={handleDeleteNews}
        />
      </section>
    </>
  )
}
