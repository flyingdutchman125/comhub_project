import { useState, useRef, useEffect } from 'react'
import Swal from 'sweetalert2'
import CropModal from '../components/CropModal'

export function SettingsPage({ user, token, selectedCommunity, userRoleInSelected, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('Profil Saya')
  
  // Tab 1: Profil Saya
  const [profileForm, setProfileForm] = useState({
    nama: user?.nama || '',
    prodi: user?.prodi || '',
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    foto_profile: user?.foto_profile || ''
  })
  const fileRef = useRef()
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const cropCallbackRef = useRef(null)

  // Tab 2: Keamanan Akun
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  // Tab 3: Pengaturan Komunitas
  const [communityForm, setCommunityForm] = useState({
    nama_komunitas: selectedCommunity?.nama_komunitas || selectedCommunity?.name || '',
    deskripsi: selectedCommunity?.deskripsi || '',
    logo: selectedCommunity?.logo || ''
  })
  const commFileRef = useRef()
  const [showCommCropModal, setShowCommCropModal] = useState(false)
  const [commCropSrc, setCommCropSrc] = useState(null)
  const commCropCallbackRef = useRef(null)

  // Tab 4: Preferensi & Tema
  const [theme, setTheme] = useState(localStorage.getItem('comhub_theme') || 'cyan')

  // Tab 5: Registrasi Admin (Khusus Kemahasiswaan)
  const [adminForm, setAdminForm] = useState({ nama: '', email: '', password: '', role: 'DOSEN' })

  useEffect(() => {
    if (selectedCommunity) {
      setCommunityForm({
        nama_komunitas: selectedCommunity.nama_komunitas || selectedCommunity.name || '',
        deskripsi: selectedCommunity.deskripsi || '',
        logo: selectedCommunity.logo || ''
      })
    }
  }, [selectedCommunity])

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropSrc(ev.target.result)
      cropCallbackRef.current = (cropped) => setProfileForm(p => ({ ...p, foto_profile: cropped }))
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCommLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCommCropSrc(ev.target.result)
      commCropCallbackRef.current = (cropped) => setCommunityForm(p => ({ ...p, logo: cropped }))
      setShowCommCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      const skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...profileForm, skills })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil berhasil diperbarui!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      if (onProfileUpdated) onProfileUpdated()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' })
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire({ icon: 'error', title: 'Gagal', text: 'Konfirmasi password baru tidak cocok!', background: '#0f172a', color: '#fff' })
    }
    try {
      const res = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password berhasil diubah!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' })
    }
  }

  const handleSaveCommunity = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:3000/api/communities/${selectedCommunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(communityForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan komunitas berhasil diperbarui!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' })
    }
  }

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('comhub_theme', newTheme)
    Swal.fire({ icon: 'success', title: 'Tema Diperbarui', text: `Tema ${newTheme} aktif!`, background: '#0f172a', color: '#fff', timer: 1000, showConfirmButton: false })
  }

  const handleRegisterAdmin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3000/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(adminForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' })
      setAdminForm({ nama: '', email: '', password: '', role: 'DOSEN' })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' })
    }
  }

  const tabs = ['Profil Saya', 'Keamanan Akun', 'Preferensi & Tema']
  if (selectedCommunity && ['KETUA', 'SEKRETARIS'].includes(userRoleInSelected)) {
    tabs.splice(2, 0, 'Pengaturan Komunitas')
  }
  if (user?.role === 'KEMAHASISWAAN') {
    tabs.push('Registrasi Admin')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigasi Settings */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-4 sticky top-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Settings Menu</h3>
          <nav className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab 
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="flex-1 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 lg:p-8">
        
        {activeTab === 'Profil Saya' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6">Profil Saya</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6 mb-6">
                <div 
                  onClick={() => fileRef.current.click()}
                  className="relative group h-24 w-24 rounded-3xl overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer flex-shrink-0"
                >
                  {profileForm.foto_profile ? (
                    <img src={profileForm.foto_profile} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl group-hover:opacity-50 transition">📷</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded">Ganti Foto</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-medium">Foto Profil</h4>
                  <p className="text-xs text-slate-400 mt-1">Disarankan gambar persegi dengan ukuran kurang dari 2MB.</p>
                </div>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                  <input type="text" value={profileForm.nama} onChange={(e) => setProfileForm({...profileForm, nama: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Program Studi</label>
                  <input type="text" value={profileForm.prodi} onChange={(e) => setProfileForm({...profileForm, prodi: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Contoh: D4 Teknik Informatika" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Keahlian (Pisahkan dengan koma)</label>
                <input type="text" value={profileForm.skills} onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" placeholder="React, Node.js, UI/UX" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Bio Singkat</label>
                <textarea value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none resize-none" placeholder="Ceritakan sedikit tentang dirimu..." />
              </div>

              <button type="submit" className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition">
                Simpan Profil
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Keamanan Akun' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6">Keamanan Akun</h2>
            <form onSubmit={handleSavePassword} className="space-y-5 max-w-md">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password Saat Ini</label>
                <input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password Baru</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Konfirmasi Password Baru</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              
              <button type="submit" className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition">
                Perbarui Password
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Pengaturan Komunitas' && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Pengaturan Komunitas</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded">Admin Only</span>
            </div>
            
            <form onSubmit={handleSaveCommunity} className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6 mb-6">
                <div 
                  onClick={() => commFileRef.current.click()}
                  className="relative group h-24 w-24 rounded-full overflow-hidden border border-slate-700 bg-slate-800 cursor-pointer flex-shrink-0"
                >
                  {communityForm.logo ? (
                    <img src={communityForm.logo} alt="Logo Komunitas" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl group-hover:opacity-50 transition">🏢</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded">Ganti Logo</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-medium">Logo Komunitas</h4>
                  <p className="text-xs text-slate-400 mt-1">Logo akan ditampilkan di beranda dan sertifikat.</p>
                </div>
                <input type="file" ref={commFileRef} className="hidden" accept="image/*" onChange={handleCommLogoChange} />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Komunitas</label>
                <input type="text" value={communityForm.nama_komunitas} onChange={(e) => setCommunityForm({...communityForm, nama_komunitas: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Deskripsi & Visi Misi</label>
                <textarea value={communityForm.deskripsi} onChange={(e) => setCommunityForm({...communityForm, deskripsi: e.target.value})} rows="5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none resize-none" placeholder="Tuliskan tujuan dan visi misi komunitas Anda di sini..." />
              </div>

              <button type="submit" className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition">
                Simpan Pengaturan Komunitas
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Preferensi & Tema' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6">Preferensi & Tema</h2>
            <div className="max-w-2xl space-y-8">
              
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Warna Aksen Aplikasi</h4>
                <div className="flex gap-4">
                  {[
                    { id: 'cyan', color: 'bg-cyan-500', label: 'Cyan Aurora' },
                    { id: 'emerald', color: 'bg-emerald-500', label: 'Emerald Forest' },
                    { id: 'violet', color: 'bg-violet-500', label: 'Cosmic Violet' },
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => changeTheme(t.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition ${
                        theme === t.id ? 'border-white bg-slate-800 shadow-md shadow-white/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${t.color}`}></div>
                      <span className="text-xs text-slate-300 font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'Registrasi Admin' && user?.role === 'KEMAHASISWAAN' && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Registrasi Admin</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded">Super Admin</span>
            </div>
            
            <form onSubmit={handleRegisterAdmin} className="space-y-6 max-w-md">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                <input type="text" value={adminForm.nama} onChange={(e) => setAdminForm({...adminForm, nama: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alamat Email</label>
                <input type="email" value={adminForm.email} onChange={(e) => setAdminForm({...adminForm, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role Akun</label>
                <select value={adminForm.role} onChange={(e) => setAdminForm({...adminForm, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none">
                  <option value="DOSEN">Dosen / Pembina</option>
                  <option value="KEMAHASISWAAN">Kemahasiswaan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password Awal</label>
                <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" required />
              </div>
              
              <button type="submit" className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition">
                Daftarkan Akun
              </button>
            </form>
          </div>
        )}

      </div>

      {showCropModal && (
        <CropModal 
          imageSrc={cropSrc} 
          onCropDone={(cropped) => { cropCallbackRef.current(cropped); setShowCropModal(false) }} 
          onCancel={() => setShowCropModal(false)} 
        />
      )}

      {showCommCropModal && (
        <CropModal 
          imageSrc={commCropSrc} 
          aspect={1}
          onCropDone={(cropped) => { commCropCallbackRef.current(cropped); setShowCommCropModal(false) }} 
          onCancel={() => setShowCommCropModal(false)} 
        />
      )}
    </div>
  )
}
