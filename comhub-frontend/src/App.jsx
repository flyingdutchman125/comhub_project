import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { useAuth } from './AuthContext'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { CommunityCard } from './components/CommunityCard'
import { CommunityDetailPage } from './pages/CommunityDetailPage'
import { ProjectTrackingPage } from './pages/ProjectTrackingPage'
import { FinancialPage } from './pages/FinancialPage'
import { MemberPage } from './pages/MemberPage'
import { InboxPage } from './pages/InboxPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { CommunityNewsPage } from './pages/CommunityNewsPage'
import CropModal from './components/CropModal'
import { AttendancePage } from './pages/AttendancePage'
import { ApprovalPage } from './pages/ApprovalPage'
import { SettingsPage } from './pages/SettingsPage'

import { CreateCommunityModal } from './components/CreateCommunityModal'
import { NewsFormModal } from './components/NewsFormModal'
import { NewsDetailModal } from './components/NewsDetailModal'

function App() {
  const [authPage, setAuthPage] = useState('login')
  const { isAuthenticated, isLoading, user, token, logout, hasCommunity, getCommunityRole, isAdmin, refreshMemberships } = useAuth()
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [showDetailPage, setShowDetailPage] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [communities, setCommunities] = useState([])
  const [topCommunities, setTopCommunities] = useState([])
  const [popularCommunities, setPopularCommunities] = useState([])
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [stats, setStats] = useState({ totalCommunities: 0, totalProjects: 0, totalMembers: 0 })

  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // News-related State & Effects
  const [newsList, setNewsList] = useState([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [showNewsModal, setShowNewsModal] = useState(false)
  const [showNewsDetailModal, setShowNewsDetailModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [selectedNews, setSelectedNews] = useState(null)
  const [newsFormData, setNewsFormData] = useState({ title: '', content: '' })

  const fetchNews = async () => {
    if (!token) return
    setLoadingNews(true)
    try {
      const res = await fetch('http://localhost:3000/api/news', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Gagal mengambil berita')
      const data = await res.json()
      setNewsList(data)
    } catch (err) {
      console.error('Error fetching news:', err)
    } finally {
      setLoadingNews(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchNews()
    }
  }, [token])

  const handleSubmitNews = async (e) => {
    e.preventDefault()
    if (!newsFormData.title || !newsFormData.content) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Judul dan isi berita harus diisi!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      return
    }

    try {
      const url = editingNews 
        ? `http://localhost:3000/api/news/${editingNews.id}` 
        : 'http://localhost:3000/api/news'
      const method = editingNews ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsFormData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal memproses berita')

      Swal.fire({
        icon: 'success',
        title: editingNews ? 'Berita diperbarui!' : 'Berita dipublikasikan!',
        text: data.message,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#06b6d4',
        timer: 1500,
        showConfirmButton: false
      })

      setShowNewsModal(false)
      setNewsFormData({ title: '', content: '' })
      setEditingNews(null)
      fetchNews()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    }
  }

  const handleDeleteNews = async (newsId) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Berita ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3000/api/news/${newsId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal menghapus berita')

        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Berita telah dihapus.',
          background: '#0f172a',
          color: '#fff',
          timer: 1500,
          showConfirmButton: false
        })
        fetchNews()
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      }
    }
  }

  const handleEditNewsClick = (newsItem) => {
    setEditingNews(newsItem)
    setNewsFormData({ title: newsItem.title, content: newsItem.content })
    setShowNewsModal(true)
  }

  const handleOpenNewsDetail = (newsItem) => {
    setSelectedNews(newsItem)
    setShowNewsDetailModal(true)
  }

  // Filtered communities
  const filteredCommunities = communities.filter(c => 
    (c.name || c.nama_komunitas || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch communities data
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      if (!isAuthenticated || !token) return
      setLoadingCommunities(true)
      try {
        const [res, topRes, popularRes] = await Promise.all([
          fetch('http://localhost:3000/api/communities', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:3000/api/communities/top'),
          fetch('http://localhost:3000/api/communities/popular')
        ])
        if (!res.ok) throw new Error('Failed to fetch communities')
        
        const data = await res.json()
        let topData = []
        if (topRes.ok) topData = await topRes.json()
        let popularData = []
        if (popularRes.ok) popularData = await popularRes.json()

        if (mounted && Array.isArray(data)) {
          setCommunities(data)
          setTopCommunities(topData)
          setPopularCommunities(popularData)
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
    const items = [{ label: 'Dashboard' }]
    const canCreateCommunityAndPortfolio = user?.role !== 'KEMAHASISWAAN' && user?.role !== 'DOSEN'

    if (!hasCommunity) {
      // User tanpa komunitas: hanya tampilkan Buat Komunitas
      if (canCreateCommunityAndPortfolio) items.push({ label: 'Buat Komunitas', action: 'create' })
    } else if (selectedCommunity) {
      const membership = user?.memberships?.find(m => m.community_id === selectedCommunity.id)
      const statusKeanggotaan = membership?.status_keanggotaan
      const role = userRoleInSelected

      if (statusKeanggotaan === 'MENUNGGU_SELEKSI') {
        // Jika masih menunggu seleksi, jangan tampilkan menu komunitas
      } else if (role === 'KETUA') {
        // Ketua: akses penuh semua menu
        items.push(
          { label: 'Project Tracking', restricted: false },
          { label: 'Financial', restricted: false },
          { label: 'Member', restricted: false },
          { label: 'Absensi', restricted: false },
          { label: 'Berita Komunitas', restricted: false }
        )
      } else if (role === 'KADIV') {
        // Kadiv: Berita Komunitas + Project Tracking & Financial read-only
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: true },
          { label: 'Absensi', restricted: true },
          { label: 'Berita Komunitas', restricted: false }
        )
      } else if (role === 'SEKRETARIS') {
        // Sekretaris: Project Tracking + Member
        items.push(
          { label: 'Project Tracking', restricted: false },
          { label: 'Member', restricted: false },
          { label: 'Absensi', restricted: false }
        )
      } else if (role === 'BENDAHARA') {
        // Bendahara: Financial + Project Tracking read-only
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: false },
          { label: 'Absensi', restricted: true }
        )
      } else if (role === 'ANGGOTA') {
        // Anggota biasa: Project Tracking & Financial read-only
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: true },
          { label: 'Absensi', restricted: true }
        )
      } else if (role === 'PEMBINA') {
        // Dosen Pembina: Pantau Project & Financial
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: true }
        )
      }
    }

    if (canCreateCommunityAndPortfolio) {
      items.push({ label: 'Portofolio' })
    }
    
    if (user?.role === 'DOSEN' || user?.role === 'KEMAHASISWAAN') {
      items.push({ label: 'Persetujuan Komunitas' })
    }

    items.push({ label: 'Settings' })
    return items
  }

  // Effect to handle role changes dynamically: if activeTab is no longer in sidebar, redirect to Dashboard
  useEffect(() => {
    const allowedTabs = getSidebarItems().map(i => i.label)
    if (!allowedTabs.includes(activeTab) && activeTab !== 'Kotak Pesan') {
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

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
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

              {/* Kotak Pesan */}
              <button 
                onClick={() => setActiveTab('Kotak Pesan')}
                className={`relative rounded-full p-2 text-slate-300 transition ${
                  activeTab === 'Kotak Pesan' 
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
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  🔔
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl z-50">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                      <h4 className="text-sm font-semibold text-white">Notifikasi</h4>
                      <span className="text-xs text-cyan-400 cursor-pointer hover:text-cyan-300">Tandai semua dibaca</span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      <div className="rounded-xl bg-slate-900/50 p-3 hover:bg-slate-900 transition cursor-pointer">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-white">Selamat datang!</p>
                          <span className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5"></span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">Mulai dengan membuat atau bergabung ke komunitas di ComHub.</p>
                        <p className="text-[10px] text-slate-500 mt-2">Baru saja</p>
                      </div>
                      <div className="rounded-xl bg-slate-900/50 p-3 hover:bg-slate-900 transition cursor-pointer">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-white">Lengkapi Profil Anda</p>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">Tambahkan informasi profil Anda untuk dikenali anggota lain.</p>
                        <p className="text-[10px] text-slate-500 mt-2">2 jam yang lalu</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {activeTab === 'Dashboard' ? (
            <>
              <section className="grid gap-6 lg:grid-cols-3 mb-8">
                {[
                  { label: 'Total Komunitas', value: stats.totalCommunities, accent: 'bg-blue-500/20 text-blue-300' },
                  { label: 'Total Program Kerja', value: stats.totalProjects, accent: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Total Anggota', value: stats.totalMembers, accent: 'bg-green-500/20 text-green-400' }
                ].map((item) => (
                  <div key={item.label} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                    <div className={`inline-flex items-center gap-3 rounded-full px-3 py-2 ${item.accent}`}>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-200">{item.label}</p>
                    </div>
                    <p className="mt-7 text-4xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-400">Data dari database</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
                <div className="flex flex-col gap-6">
                  {/* Top Communities Widget */}
                  {topCommunities.length > 0 && (
                    <div className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 relative overflow-hidden shadow-lg shadow-cyan-500/5">
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
                  )}

                  {/* Popular Communities Widget (Kunjungan Tertinggi Minggu Ini) */}
                  {popularCommunities.length > 0 && (
                    <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 relative overflow-hidden shadow-lg shadow-emerald-500/5">
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
                  )}

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
                    ) : newsList.length === 0 ? (
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
                            {(user?.role === 'KEMAHASISWAAN' || (news.community_id && ['KETUA', 'KADIV'].includes(getCommunityRole(news.community_id)))) && (
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
              </section>
            </>
          ) : activeTab === 'Project Tracking' && selectedCommunity ? (
            <ProjectTrackingPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} currentUser={user} />
          ) : activeTab === 'Financial' && selectedCommunity ? (
            <FinancialPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} />
          ) : activeTab === 'Member' && selectedCommunity ? (
            <MemberPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} />
          ) : activeTab === 'Absensi' && selectedCommunity ? (
            <AttendancePage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} />
          ) : activeTab === 'Berita Komunitas' && selectedCommunity ? (
            <CommunityNewsPage communityId={selectedCommunity.id} token={token} communityName={selectedCommunity.name || selectedCommunity.nama_komunitas} />
          ) : activeTab === 'Kotak Pesan' ? (
            <InboxPage token={token} currentUser={user} />
          ) : activeTab === 'Persetujuan Komunitas' ? (
            <ApprovalPage token={token} userRole={user?.role} />
          ) : activeTab === 'Portofolio' ? (
            <PortfolioPage />
          ) : activeTab === 'Settings' ? (
            <SettingsPage user={user} token={token} selectedCommunity={selectedCommunity} userRoleInSelected={userRoleInSelected} onProfileUpdated={() => window.location.reload()} />
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
      <NewsFormModal 
        isOpen={showNewsModal} 
        onClose={() => setShowNewsModal(false)} 
        onSubmit={handleSubmitNews} 
        formData={newsFormData} 
        setFormData={setNewsFormData} 
        isEditing={!!editingNews} 
      />
      <NewsDetailModal 
        isOpen={showNewsDetailModal} 
        onClose={() => setShowNewsDetailModal(false)} 
        news={selectedNews} 
      />
    </div>
  )
}

export default App
