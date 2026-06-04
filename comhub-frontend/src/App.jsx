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
import { DashboardPage } from './pages/DashboardPage'
import { CreateCommunityModal } from './components/CreateCommunityModal'
import { NewsFormModal } from './components/NewsFormModal'
import { NewsDetailModal } from './components/NewsDetailModal'
import NotificationCenter from './components/NotificationCenter'
import TaskInbox from './components/TaskInbox'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { io } from 'socket.io-client'

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
  const [showInboxModal, setShowInboxModal] = useState(false)
  const [showTaskInbox, setShowTaskInbox] = useState(false)
  const [globalSocket, setGlobalSocket] = useState(null)

  useEffect(() => {
    if (token && user) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')
      socket.emit('join_user_notifications', user.id)
      if (selectedCommunity) {
        socket.emit('join_community_notifications', selectedCommunity.id)
      }
      setGlobalSocket(socket)
      return () => socket.disconnect()
    }
  }, [token, user, selectedCommunity])

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
        <Sidebar 
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowCreateModal={setShowCreateModal}
          hasCommunity={hasCommunity}
          communities={communities}
          user={user}
          selectedCommunity={selectedCommunity}
          setSelectedCommunity={setSelectedCommunity}
          userRoleInSelected={userRoleInSelected}
          logout={logout}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Header 
            activeTab={activeTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowTaskInbox={setShowTaskInbox}
            showInboxModal={showInboxModal}
            setShowInboxModal={setShowInboxModal}
            setShowNotifications={setShowNotifications}
          />

          {activeTab === 'Dashboard' ? (
            <DashboardPage 
              stats={stats}
              topCommunities={topCommunities}
              popularCommunities={popularCommunities}
              newsList={newsList}
              communities={communities}
              filteredCommunities={filteredCommunities}
              loadingCommunities={loadingCommunities}
              loadingNews={loadingNews}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setShowCreateModal={setShowCreateModal}
              user={user}
              setSelectedCommunity={setSelectedCommunity}
              setShowDetailPage={setShowDetailPage}
              setEditingNews={setEditingNews}
              setNewsFormData={setNewsFormData}
              setShowNewsModal={setShowNewsModal}
              handleOpenNewsDetail={handleOpenNewsDetail}
              getCommunityRole={getCommunityRole}
              handleEditNewsClick={handleEditNewsClick}
              handleDeleteNews={handleDeleteNews}
            />
          ) : activeTab === 'Project Tracking' && selectedCommunity ? (
            <ProjectTrackingPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} currentUser={user} />
          ) : activeTab === 'Financial' && selectedCommunity ? (
            <FinancialPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} />
          ) : activeTab === 'Member' && selectedCommunity ? (
            <MemberPage communityId={selectedCommunity.id} token={token} isReadOnly={isReadOnly} currentUserRole={userRoleInSelected} refreshMemberships={refreshMemberships} currentUser={user} />
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
      
      <NotificationCenter 
        token={token} 
        socket={globalSocket} 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      <TaskInbox 
        token={token} 
        isOpen={showTaskInbox} 
        onClose={() => setShowTaskInbox(false)} 
      />

      <InboxPage 
        token={token} 
        currentUser={user} 
        isOpen={showInboxModal} 
        onClose={() => setShowInboxModal(false)} 
      />
    </div>
  )
}

export default App
