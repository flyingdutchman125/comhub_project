import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useAuth } from './AuthContext'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { CommunityCard } from './CommunityCard'
import { CommunityDetailPage } from './CommunityDetailPage'
import { ProjectTrackingPage } from './ProjectTrackingPage'
import { FinancialPage } from './FinancialPage'
import { MemberPage } from './MemberPage'
import { InboxPage } from './InboxPage'
import { PortfolioPage } from './PortfolioPage'

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

function NewsFormModal({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-lg w-full shadow-2xl shadow-cyan-500/5">
        <h3 className="text-2xl font-bold text-white">{isEditing ? 'Edit Berita Terkini' : 'Tambah Berita Terkini'}</h3>
        <p className="mt-2 text-slate-400 text-sm">Publikasikan informasi atau pengumuman resmi ke seluruh mahasiswa dan dosen.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Judul Berita</label>
            <input 
              type="text" 
              required
              value={formData.title} 
              onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 transition" 
              placeholder="Masukkan judul menarik" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Isi Berita</label>
            <textarea 
              required 
              rows="6"
              value={formData.content} 
              onChange={(e) => setFormData(p => ({...p, content: e.target.value}))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 transition resize-none" 
              placeholder="Tuliskan detail pengumuman atau berita secara lengkap di sini..." 
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 font-bold transition shadow-lg shadow-cyan-500/20"
            >
              {isEditing ? 'Simpan' : 'Publikasikan'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2.5 font-bold transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewsDetailModal({ isOpen, onClose, news }) {
  if (!isOpen || !news) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-xl w-full shadow-2xl shadow-cyan-500/5 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-3 py-1 text-xs font-semibold uppercase tracking-wider">PENGUMUMAN RESMI</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-lg">✕</button>
        </div>
        
        <div className="overflow-y-auto mt-4 flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <h3 className="text-2xl font-bold text-white leading-snug">{news.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span>✍️ Oleh: <strong className="text-slate-300">{news.author_name || 'Admin'}</strong></span>
            <span>📅 Dipublikasikan: <strong className="text-slate-300">{new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
          
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

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
    const items = [{ label: 'Dashboard' }]

    if (!hasCommunity) {
      // User tanpa komunitas: hanya tampilkan Buat Komunitas
      items.push({ label: 'Buat Komunitas', action: 'create' })
    } else if (selectedCommunity) {
      const role = userRoleInSelected

      if (role === 'KETUA') {
        // Ketua: akses penuh semua menu
        items.push(
          { label: 'Project Tracking', restricted: false },
          { label: 'Financial', restricted: false },
          { label: 'Member', restricted: false }
        )
      } else if (role === 'SEKRETARIS') {
        // Sekretaris: Project Tracking + Member
        items.push(
          { label: 'Project Tracking', restricted: false },
          { label: 'Member', restricted: false }
        )
      } else if (role === 'BENDAHARA') {
        // Bendahara: Financial + Project Tracking read-only
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: false }
        )
      } else {
        // Anggota biasa: Project Tracking & Financial read-only
        items.push(
          { label: 'Project Tracking', restricted: true },
          { label: 'Financial', restricted: true }
        )
      }
    }

    items.push({ label: 'Kotak Pesan' })
    items.push({ label: 'Portofolio' })
    items.push({ label: 'Settings' })
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
                  ) : filteredCommunities.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-slate-400">Tidak ada komunitas yang sesuai dengan pencarian Anda.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredCommunities.map((c) => (
                        <CommunityCard key={c.id} community={c} onSelect={(comm) => { setSelectedCommunity(comm); setShowDetailPage(true) }} />
                      ))}
                    </div>
                  )}
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
                            <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Info</span>
                            <span className="text-[10px] text-slate-500">{new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition duration-200 line-clamp-1">{news.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{news.content}</p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">✍️ {news.author_name || 'Admin'}</p>
                            {user?.role === 'KEMAHASISWAAN' && (
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
          ) : activeTab === 'Kotak Pesan' ? (
            <InboxPage token={token} currentUser={user} />
          ) : activeTab === 'Portofolio' ? (
            <PortfolioPage />
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
