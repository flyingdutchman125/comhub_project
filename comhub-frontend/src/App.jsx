import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { CommunityCard } from './CommunityCard'
import { CommunityDetailPage } from './CommunityDetailPage'
import { ProjectTrackingPage } from './ProjectTrackingPage'
import { FinancialPage } from './FinancialPage'
import { MemberPage } from './MemberPage'
import { InboxPage } from './InboxPage'

function CreateCommunityModal({ isOpen, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState({ nama_komunitas: '', deskripsi: '', logo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal membuat komunitas')
      onSuccess()
      setFormData({ nama_komunitas: '', deskripsi: '', logo: '' })
      onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
        <h3 className="text-2xl font-semibold text-white">Buat Komunitas Baru</h3>
        <p className="mt-2 text-slate-400">Anda akan menjadi Ketua komunitas ini</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Nama Komunitas</label>
            <input type="text" name="nama_komunitas" value={formData.nama_komunitas} onChange={(e) => setFormData(p => ({...p, nama_komunitas: e.target.value}))} required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="Nama komunitas Anda" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Deskripsi</label>
            <textarea name="deskripsi" value={formData.deskripsi} onChange={(e) => setFormData(p => ({...p, deskripsi: e.target.value}))} required rows="4"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="Jelaskan tentang komunitas Anda" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Logo URL (Optional)</label>
            <input type="url" name="logo" value={formData.logo} onChange={(e) => setFormData(p => ({...p, logo: e.target.value}))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="https://example.com/logo.png" />
          </div>
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50">
              {loading ? 'Membuat...' : 'Buat Komunitas'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function App() {
  const [authPage, setAuthPage] = useState('login')
  const { isAuthenticated, isLoading, user, token, logout, hasCommunity, getCommunityRole, isAdmin, refreshMemberships } = useAuth()
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [showDetailPage, setShowDetailPage] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [communities, setCommunities] = useState([])
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [stats, setStats] = useState({ totalCommunities: 0, totalProjects: 0, totalMembers: 0 })

  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  // Fetch communities data
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      if (!isAuthenticated || !token) return
      setLoadingCommunities(true)
      try {
        const res = await fetch('http://localhost:3000/api/communities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (mounted && Array.isArray(data)) {
          setCommunities(data)
          let totalMembers = 0, totalProjects = 0
          data.forEach(c => { totalMembers += (c.memberCount || 0); totalProjects += (c.projectCount || 0) })
          setStats({ totalCommunities: data.length, totalProjects, totalMembers })
        }
      } catch (err) { console.error(err) }
      finally { if (mounted) setLoadingCommunities(false) }
    }
    if (isAuthenticated) fetchData()
    return () => { mounted = false }
  }, [isAuthenticated, token])

  // Auto-select komunitas pertama user dari community_members jika belum ada yang dipilih (hanya sekali)
  useEffect(() => {
    if (!selectedCommunity && hasCommunity && communities.length > 0 && user?.memberships?.length > 0 && !hasAutoSelected) {
      const firstMembership = user.memberships[0]
      const matchedCommunity = communities.find(c => c.id === firstMembership.community_id)
      if (matchedCommunity) {
        setSelectedCommunity(matchedCommunity)
        setHasAutoSelected(true)
      }
    }
  }, [communities, hasCommunity, user, selectedCommunity, hasAutoSelected])

  // Determine user's role in selected community
  const userRoleInSelected = selectedCommunity ? getCommunityRole(selectedCommunity.id) : null
  const isAdminInSelected = selectedCommunity ? isAdmin(selectedCommunity.id) : false
  const isReadOnly = selectedCommunity && !isAdminInSelected

  // Build sidebar items based on role
  const getSidebarItems = () => {
    const items = [{ label: 'Dashboard', icon: '📊' }]

    if (!hasCommunity) {
      // User tanpa komunitas: hanya tampilkan Buat Komunitas
      items.push({ label: 'Buat Komunitas', icon: '➕', action: 'create' })
    } else if (selectedCommunity) {
      const role = userRoleInSelected

      if (role === 'KETUA') {
        // Ketua: akses penuh semua menu
        items.push(
          { label: 'Project Tracking', icon: '📋', restricted: false },
          { label: 'Financial', icon: '💰', restricted: false },
          { label: 'Member', icon: '👥', restricted: false }
        )
      } else if (role === 'SEKRETARIS') {
        // Sekretaris: Project Tracking + Member
        items.push(
          { label: 'Project Tracking', icon: '📋', restricted: false },
          { label: 'Member', icon: '👥', restricted: false }
        )
      } else if (role === 'BENDAHARA') {
        // Bendahara: Financial saja
        items.push(
          { label: 'Financial', icon: '💰', restricted: false }
        )
      } else {
        // Anggota biasa: Financial read-only
        items.push(
          { label: 'Financial', icon: '💰', restricted: true }
        )
      }
    }

    items.push({ label: 'Kotak Pesan', icon: '✉️' })
    items.push({ label: 'Settings', icon: '⚙️' })
    return items
  }

  // Effect to handle role changes dynamically: if activeTab is no longer in sidebar, redirect to Dashboard
  useEffect(() => {
    const allowedTabs = getSidebarItems().map(i => i.label)
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('Dashboard')
    }
  }, [userRoleInSelected, selectedCommunity, activeTab, hasCommunity])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060b1b] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin mx-auto" />
          <p className="text-slate-400">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return authPage === 'login'
      ? <LoginForm onSwitchToRegister={() => setAuthPage('register')} onLoginSuccess={() => setActiveTab('Dashboard')} />
      : <RegisterForm onSwitchToLogin={() => setAuthPage('login')} onRegisterSuccess={() => setAuthPage('login')} />
  }

  if (showDetailPage && selectedCommunity) {
    return (
      <CommunityDetailPage
        community={selectedCommunity}
        token={token}
        onBack={() => { setShowDetailPage(false); setSelectedCommunity(null); setActiveTab('Dashboard') }}
      />
    )
  }

  const sidebarItems = getSidebarItems()

  return (
    <div className="min-h-screen bg-[#060b1b] text-slate-100">
      <div className="lg:flex lg:min-h-screen">
        {/* Sidebar */}
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
                    <span className="text-lg">{item.icon}</span>{item.label}
                  </button>
                )
              }
              const isActive = item.label === activeTab
              return (
                <button key={item.label} onClick={() => setActiveTab(item.label)} title={item.restricted ? 'Mode Read-Only' : ''}
                  className={`w-full flex items-center gap-4 rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${isActive
                    ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-cyan-200 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <span className="text-lg">{item.icon}</span>{item.label}
                  {item.restricted && <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">🔍</span>}
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

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-8">
            <div>
              <p className="text-sm text-slate-500">Dashboard / ComHub</p>
              <h2 className="text-3xl font-semibold text-white">{activeTab}</h2>
            </div>
          </header>

          {activeTab === 'Dashboard' ? (
            <>
              <section className="grid gap-6 lg:grid-cols-3 mb-8">
                {[
                  { label: 'Total Komunitas', icon: '🏢', value: stats.totalCommunities, accent: 'bg-blue-500/20 text-blue-300' },
                  { label: 'Total Program Kerja', icon: '📋', value: stats.totalProjects, accent: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Total Anggota', icon: '👥', value: stats.totalMembers, accent: 'bg-green-500/20 text-green-400' }
                ].map((item) => (
                  <div key={item.label} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                    <div className={`inline-flex items-center gap-3 rounded-full px-3 py-2 ${item.accent}`}>
                      <span>{item.icon}</span>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-200">{item.label}</p>
                    </div>
                    <p className="mt-7 text-4xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-400">Data dari database</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
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
                      <button onClick={() => setShowCreateModal(true)} className="mt-4 rounded-lg bg-cyan-500/20 text-cyan-300 px-4 py-2 text-sm hover:bg-cyan-500/30 transition">
                        Buat Komunitas Pertama Anda
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {communities.map((c) => (
                        <CommunityCard key={c.id} community={c} onSelect={(comm) => { setSelectedCommunity(comm); setShowDetailPage(true) }} />
                      ))}
                    </div>
                  )}
                </div>

                <aside className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Info</h3>
                  <p className="text-sm text-slate-500 mb-6">Tentang ComHub</p>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                      <p className="text-sm text-slate-300">ComHub adalah platform manajemen komunitas yang dirancang untuk memudahkan kolaborasi anggota.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                      <p className="text-xs font-semibold text-slate-400 mb-2">FITUR:</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Manajemen Anggota</li>
                        <li>✓ Tracking Proyek</li>
                        <li>✓ Laporan Finansial</li>
                        <li>✓ Kontrol Akses Berbasis Role</li>
                      </ul>
                    </div>
                    {!hasCommunity && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <p className="text-xs font-semibold text-emerald-400 mb-2">MULAI SEKARANG</p>
                        <p className="text-xs text-slate-400 mb-3">Buat komunitas pertamamu atau bergabung dengan yang sudah ada!</p>
                        <button onClick={() => setShowCreateModal(true)} className="w-full rounded-lg bg-emerald-500/20 text-emerald-300 px-3 py-2 text-xs hover:bg-emerald-500/30 transition">
                          ➕ Buat Komunitas
                        </button>
                      </div>
                    )}
                  </div>
                </aside>
              </section>
            </>
          ) : activeTab === 'Project Tracking' && selectedCommunity ? (
            <ProjectTrackingPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} />
          ) : activeTab === 'Financial' && selectedCommunity ? (
            <FinancialPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} />
          ) : activeTab === 'Member' && selectedCommunity ? (
            <MemberPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} />
          ) : activeTab === 'Kotak Pesan' ? (
            <InboxPage token={token} currentUser={user} />
          ) : activeTab !== 'Dashboard' ? (
            <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
              <h3 className="text-2xl font-semibold text-white">{activeTab}</h3>
              <p className="mt-3 text-slate-400">
                {!selectedCommunity ? 'Silakan pilih komunitas terlebih dahulu dari Dashboard.' : `Halaman ${activeTab} belum tersedia.`}
              </p>
            </section>
          ) : null}
        </main>
      </div>
      <CreateCommunityModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}
        onSuccess={async () => { await refreshMemberships(); window.location.reload() }} token={token} />
    </div>
  )
}

export default App
