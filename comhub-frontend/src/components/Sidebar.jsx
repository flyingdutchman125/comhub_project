import React from 'react';

export const Sidebar = ({
  sidebarItems,
  activeTab,
  setActiveTab,
  setShowCreateModal,
  hasCommunity,
  communities,
  user,
  selectedCommunity,
  setSelectedCommunity,
  userRoleInSelected,
  logout
}) => {
  return (
    <aside className="lg:w-80 w-full bg-[#050918] border-slate-800 border-b lg:border-b-0 lg:border-r p-6 flex flex-col">
      <div className="mb-10">
        <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-4 shadow-sm shadow-cyan-500/10">
          <div className="h-12 w-12 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center text-xl text-slate-950 font-bold">C</div>
          <div>
            <p className="text-sm text-slate-400">ComHub</p>
            <h1 className="text-lg font-semibold text-white">Community Dashboard</h1>
          </div>
        </div>
      </div>

      <nav className="space-y-3">
        {sidebarItems.map((item) => {
          if (item.action === 'create') {
            return (
              <button key={item.label} onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-4 rounded-3xl px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-200 hover:from-emerald-500/30 hover:to-emerald-600/30 transition">
                {item.label}
              </button>
            )
          }
          const isActive = item.label === activeTab
          return (
            <button key={item.label} onClick={() => setActiveTab(item.label)} title={item.restricted ? 'Mode Read-Only' : ''}
              className={`w-full flex items-center gap-4 rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${isActive
                ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-cyan-200 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.label}
              {item.restricted && <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">Read-Only</span>}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4">
        {hasCommunity && communities.length > 0 && user?.memberships && (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs text-slate-400 mb-2">KOMUNITAS TERPILIH</p>
            <select 
              value={selectedCommunity?.id || ''} 
              onChange={(e) => {
                const comm = communities.find(c => c.id === Number(e.target.value))
                if (comm) setSelectedCommunity(comm)
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500 mb-2"
            >
              {!selectedCommunity && <option value="" disabled>Pilih Komunitas</option>}
              {communities.filter(c => user.memberships.some(m => m.community_id === c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.name || c.nama_komunitas}</option>
              ))}
            </select>
            {selectedCommunity && (
              <p className="text-xs text-slate-400 mt-1">Role: {userRoleInSelected || 'Non-Member'}</p>
            )}
          </div>
        )}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-slate-950">
              {user?.nama?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nama || 'User'}</p>
              <p className="text-xs text-slate-400">{hasCommunity ? `${user.memberships.length} komunitas` : 'Belum ada komunitas'}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { logout(); setActiveTab('Dashboard'); setSelectedCommunity(null) }}
          className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition">
          Logout
        </button>
      </div>
    </aside>
  );
};
