import React from 'react';

export const Header = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  setShowTaskInbox,
  showInboxModal,
  setShowInboxModal,
  setShowNotifications
}) => {
  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-8 relative z-40">
      <div>
        <p className="text-sm text-slate-500 capitalize">{activeTab} Page / ComHub</p>
        <h2 className="text-3xl font-semibold text-white">{activeTab}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        {activeTab === 'Dashboard' && (
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari komunitas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>
        )}

        {/* Task Inbox */}
        <button 
          onClick={() => setShowTaskInbox(true)}
          className="relative rounded-full p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition bg-slate-800"
          title="Kotak Tugas"
        >
          📋
        </button>

        {/* Kotak Pesan */}
        <button 
          onClick={() => setShowInboxModal(true)}
          className={`relative rounded-full p-2 text-slate-300 transition ${
            showInboxModal 
              ? 'bg-cyan-500 text-slate-950 font-bold' 
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title="Kotak Pesan"
        >
          ✉️
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Notifikasi"
          >
            🔔
            <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
