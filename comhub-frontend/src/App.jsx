import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { CommunityCard } from './CommunityCard'
import { CommunityDetailPage } from './CommunityDetailPage'

const useProjectTracking = () => {
  const STORAGE_KEY = 'comhub_projects'
  
  const defaultProjects = [
    {
      id: 1,
      name: 'Pembangunan Website Komunitas',
      owner: 'Fiona',
      deadline: '28 Mei 2026',
      status: 'On Track',
      progress: 76,
      budget: 'Rp 500.000',
    },
    {
      id: 2,
      name: 'Program Pelatihan UI/UX',
      owner: 'Rizky',
      deadline: '4 Juni 2026',
      status: 'At Risk',
      progress: 54,
      budget: 'Rp 1.500.000',
    },
    {
      id: 3,
      name: 'Event Showcase Komunitas',
      owner: 'Nadia',
      deadline: '15 Juni 2026',
      status: 'Planning',
      progress: 32,
      budget: 'Rp 1.000.000',
    },
  ]

  const [projects, setProjects] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : defaultProjects
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  const addProject = (project) => {
    const newProject = {
      ...project,
      id: Date.now(),
    }
    setProjects([...projects, newProject])
    return newProject
  }

  const updateProject = (id, updatedProject) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updatedProject } : p))
  }

  const deleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  return { projects, addProject, updateProject, deleteProject }
}

const sidebarItems = [
  { label: 'Dashboard' },
  { label: 'Project Tracking' },
  { label: 'Financial' },
  { label: 'Member' },
  { label: 'Settings' },
]

const quickStats = [
  { label: 'Total Komunitas Aktif Saat ini', value: '20', accent: 'bg-cyan-500/20 text-cyan-300' },
  { label: 'Program Kerja berjalan', value: '12', accent: 'bg-violet-500/20 text-violet-300' },
  { label: 'Total anggota keseluruhan', value: '450', accent: 'bg-sky-500/20 text-sky-300' },
]

const popularCommunities = [
  { name: 'Pala Pens LA', description: 'Komunitas pecinta alam PENS PSDKU Lamongan.', members: '120' },
  { name: 'RoboTech LA', description: 'Eksplorasi robotika, IoT, dan inovasi industri.', members: '90' },
  { name: 'Creative Pixel', description: 'Belajar UI/UX dan branding visual kreatif.', members: '70' },
  { name: 'Dev-Force Lamongan', description: 'Developer muda belajar web dan competitive programming.', members: '56' },
  { name: 'G-Force Esports', description: 'Komunitas e-sports kompetitif kuliah aktif.', members: '55' },
]

const hubCards = [
  {
    title: 'Komunitas Pala',
    subtitle: 'Komunitas Pecinta Alam melakukan kegiatan bersama',
    image: '/pala-hero.svg',
  },
  {
    title: 'Komunitas Robotic',
    subtitle: 'Potret praktik anak komunitas robotic di lab PENS',
    image: '/robotic-hero.svg',
  },
]

const communityInfo = {
  title: 'ComHub Community Info',
  description: 'Platform ini menampilkan komunitas aktif, kegiatan berjalan, dan rekomendasi komunitas populer dalam satu dashboard modern.',
  stats: [
    { label: 'Slides', value: '24' },
    { label: 'Aktivitas', value: '18' },
    { label: 'Rating', value: '4.9/5' },
  ],
  notes: ['Terapkan event mingguan', 'Integrasi data anggota', 'Optimasi onboarding peserta'],
}

const projectTrackingStats = [
  { label: 'Proyek Aktif', value: '8', accent: 'bg-cyan-500/20 text-cyan-300' },
  { label: 'Selesai Tepat Waktu', value: '5', accent: 'bg-emerald-500/20 text-emerald-300' },
  { label: 'Issue Terbuka', value: '3', accent: 'bg-amber-500/20 text-amber-300' },
]



const projectMilestones = [
  { title: 'Review Desain Akhir', due: '21 Mei 2026', status: 'Selesai' },
  { title: 'Testing Modul Pendaftaran', due: '25 Mei 2026', status: 'Berlangsung' },
  { title: 'Persiapan Launch Event', due: '31 Mei 2026', status: 'Menunggu' },
]

function ProjectTrackingPage({ projects, onAddProject, onUpdateProject, onDeleteProject }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    deadline: '',
    status: 'Planning',
    progress: 0,
    budget: '',
  })

  const handleOpenForm = (project = null) => {
    if (project) {
      setFormData(project)
      setEditingId(project.id)
    } else {
      setFormData({
        name: '',
        owner: '',
        deadline: '',
        status: 'Planning',
        progress: 0,
        budget: '',
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      onUpdateProject(editingId, formData)
    } else {
      onAddProject(formData)
    }
    setShowForm(false)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    onDeleteProject(id)
    setDeleteConfirm(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) || 0 : value,
    }))
  }

  const activeProjects = projects.filter(p => p.status !== 'Planning').length
  const onTimeProjects = projects.filter(p => p.status === 'On Track').length
  const atRiskProjects = projects.filter(p => p.status === 'At Risk').length

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="inline-flex items-center gap-3 rounded-full px-3 py-2 bg-cyan-500/20 text-cyan-300">
   
            <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Proyek Aktif</p>
          </div>
          <p className="mt-7 text-4xl font-semibold text-white">{activeProjects}</p>
          <p className="mt-2 text-sm text-slate-400">Memantau status project secara real-time.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="inline-flex items-center gap-3 rounded-full px-3 py-2 bg-emerald-500/20 text-emerald-300">
        
            <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Selesai Tepat Waktu</p>
          </div>
          <p className="mt-7 text-4xl font-semibold text-white">{onTimeProjects}</p>
          <p className="mt-2 text-sm text-slate-400">Memantau status project secara real-time.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="inline-flex items-center gap-3 rounded-full px-3 py-2 bg-amber-500/20 text-amber-300">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Issue Terbuka</p>
          </div>
          <p className="mt-7 text-4xl font-semibold text-white">{atRiskProjects}</p>
          <p className="mt-2 text-sm text-slate-400">Memantau status project secara real-time.</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Project Tracking</h3>
            <p className="text-sm text-slate-500">Lihat progress, deadline, dan status tim untuk setiap proyek.</p>
          </div>
          <button onClick={() => handleOpenForm()} className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15">
            Tambah Proyek Baru
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-4 pr-6">Proyek</th>
                <th className="pb-4 pr-6">Pemilik</th>
                <th className="pb-4 pr-6">Deadline</th>
                <th className="pb-4 pr-6">Status</th>
                <th className="pb-4 pr-6">Progress</th>
                <th className="pb-4 pr-6">Budget</th>
                <th className="pb-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-4 pr-6 font-medium text-white">{project.name}</td>
                  <td className="py-4 pr-6 text-slate-400">{project.owner}</td>
                  <td className="py-4 pr-6 text-slate-400">{project.deadline}</td>
                  <td className="py-4 pr-6">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
                      project.status === 'On Track'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : project.status === 'At Risk'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-slate-700/80 text-slate-200'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6">
                    <div className="w-32 rounded-full bg-slate-800/80 p-1">
                      <div className="rounded-full bg-cyan-400 text-right text-[11px] text-slate-950" style={{ width: `${project.progress}%` }}>
                        <span className="block px-2 py-1">{project.progress}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-6 text-slate-400">{project.budget}</td>
                  <td className="py-4 flex items-center gap-2">
                    <button onClick={() => handleOpenForm(project)} className="rounded-lg px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition">
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(project.id)} className="rounded-lg px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Nama Proyek</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Pemilik</label>
                  <input type="text" name="owner" value={formData.owner} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Deadline</label>
                  <input type="text" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="dd Mmm yyyy" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400">
                    <option>Planning</option>
                    <option>On Track</option>
                    <option>At Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Progress (%)</label>
                  <input type="number" name="progress" value={formData.progress} onChange={handleChange} min="0" max="100" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Budget</label>
                <input type="text" name="budget" value={formData.budget} onChange={handleChange} required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-400" placeholder="Rp X.XXX.XXX" />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
                  Batal
                </button>
                <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white">Hapus Proyek?</h3>
            <p className="mt-2 text-sm text-slate-400">Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Milestones Mendatang</h3>
              <p className="text-sm text-slate-500">Prioritas milestone untuk tim proyek.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">3 Items</span>
          </div>

          <div className="mt-6 space-y-4">
            {projectMilestones.map((milestone) => (
              <div key={milestone.title} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{milestone.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">Deadline {milestone.due}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${
                    milestone.status === 'Selesai'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : milestone.status === 'Berlangsung'
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : 'bg-slate-700/80 text-slate-200'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
          <h3 className="text-xl font-semibold text-white">Insights & Notes</h3>
          <p className="mt-2 text-sm text-slate-500">Ringkasan temuan dan rekomendasi untuk meningkatkan delivery tim.</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-300">Percepat komunikasi antar tim agar kendala teknis teratasi lebih cepat.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-300">Gunakan sprint mingguan untuk menyelaraskan prioritas deliverable.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-300">Review anggaran rutin untuk menghindari overbudget pada proyek besar.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [authPage, setAuthPage] = useState('login')
  const { isAuthenticated, isLoading, user, token, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [showDetailPage, setShowDetailPage] = useState(false)
  const [communities, setCommunities] = useState(popularCommunities)
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const { projects, addProject, updateProject, deleteProject } = useProjectTracking()

  // Fetch communities from backend when authenticated
  useEffect(() => {
    let mounted = true
    
    const fetchCommunities = async () => {
      if (!isAuthenticated || !token) return
      
      setLoadingCommunities(true)
      try {
        const res = await fetch('http://localhost:3000/api/communities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!res.ok) {
          console.error('Failed to fetch communities')
          return
        }
        
        const data = await res.json()
        if (mounted) {
          setCommunities(Array.isArray(data) ? data : popularCommunities)
        }
      } catch (err) {
        console.error('Error fetching communities:', err)
        if (mounted) setCommunities(popularCommunities)
      } finally {
        if (mounted) setLoadingCommunities(false)
      }
    }

    if (isAuthenticated) {
      fetchCommunities()
    }

    return () => { mounted = false }
  }, [isAuthenticated, token])

  const pageTitle = activeTab === 'Dashboard' ? 'Modern Dark Community Dashboard' : activeTab === 'Project Tracking' ? 'Project Tracking Overview' : `${activeTab} Page`

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
    return authPage === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthPage('register')} onLoginSuccess={() => setActiveTab('Dashboard')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthPage('login')} onRegisterSuccess={() => {
        setAuthPage('login')
      }} />
    )
  }

  // Show community detail page
  if (showDetailPage && selectedCommunity) {
    return (
      <CommunityDetailPage
        community={selectedCommunity}
        token={token}
        onBack={() => {
          setShowDetailPage(false)
          setSelectedCommunity(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#060b1b] text-slate-100">
      <div className="lg:flex lg:min-h-screen">
        <aside className="lg:w-80 w-full bg-[#050918] border-slate-800 border-b lg:border-b-0 lg:border-r p-6 flex flex-col">
          <div className="mb-10">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-4 shadow-sm shadow-cyan-500/10">
              <div className="h-12 w-12 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center text-xl text-slate-950 font-bold">
                C
              </div>
              <div>
                <p className="text-sm text-slate-400">Comhub</p>
                <h1 className="text-lg font-semibold text-white">Community Dashboard</h1>
              </div>
            </div>
          </div>

          <nav className="space-y-3">
            {sidebarItems.map((item) => {
              const isActive = item.label === activeTab
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-4 rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-cyan-200 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4">
            {/* User Profile */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-slate-950">
                  {user?.nama?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.nama || 'User'}</p>
                  <p className="text-xs text-slate-400">ID: {user?.id}</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout()
                setActiveTab('Dashboard')
              }}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              Logout
            </button>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/20 p-5 shadow-inner shadow-slate-950/10">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">Need help?</p>
              <p className="text-sm text-slate-300 leading-6">Akses pengaturan komunitas dan update fitur kapan saja dari sidebar.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-slate-500">Dashboard / ComHub</p>
              <h2 className="text-3xl font-semibold text-white">Modern Dark Community Dashboard</h2>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-96">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔎</span>
                <input
                  type="search"
                  placeholder="Search Community..."
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-lg">AS</div>
                <div>
                  <p className="text-sm text-slate-400">Ahmad Syifaul</p>
                  <p className="text-xs text-slate-500">Admin Community</p>
                </div>
              </div>
            </div>
          </header>

          {activeTab === 'Dashboard' ? (
            <>
              <section className="mt-8 grid gap-6 lg:grid-cols-3">
                {quickStats.map((item) => (
                  <div key={item.label} className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                    <div className={`inline-flex items-center gap-3 rounded-full px-3 py-2 ${item.accent}`}>
                      <span>{item.icon}</span>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-200">{item.label}</p>
                    </div>
                    <p className="mt-7 text-4xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-400">Statistik komunitas terbaru</p>
                  </div>
                ))}
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">Daftar Komunitas</h3>
                        <p className="text-sm text-slate-500">Pilih komunitas untuk melihat detail dan bergabung</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{communities.length} Komunitas</span>
                    </div>

                    {loadingCommunities ? (
                      <div className="mt-6 flex justify-center">
                        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {communities.map((community) => (
                          <CommunityCard
                            key={community.name || community.id}
                            community={community}
                            onSelect={(c) => {
                              setSelectedCommunity(c)
                              setShowDetailPage(true)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/10">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">Hub</h3>
                        <p className="text-sm text-slate-500">Highlight komunitas terbaru dan galeri kegiatan.</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">Gallery</span>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {hubCards.map((card) => (
                        <div key={card.title} className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
                          <img src={card.image} alt={card.title} className="h-48 w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
                          <div className="absolute bottom-5 left-5 right-5">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{card.title}</p>
                            <h4 className="mt-2 text-xl font-semibold text-white">{card.subtitle}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </section>
            </>
          ) : activeTab === 'Project Tracking' ? (
            <ProjectTrackingPage projects={projects} onAddProject={addProject} onUpdateProject={updateProject} onDeleteProject={deleteProject} />
          ) : (
            <section className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/10">
              <h3 className="text-2xl font-semibold text-white">{activeTab}</h3>
              <p className="mt-3 text-slate-400">Halaman {activeTab} belum tersedia. Silakan pilih tab lain.</p>
            </section>
          )}

        </main>
      </div>
    </div>
  )
}

export default App
