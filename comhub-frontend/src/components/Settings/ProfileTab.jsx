import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import CropModal from '../CropModal';

export default function ProfileTab({ user, token, onProfileUpdated }) {
  const [profileForm, setProfileForm] = useState({
    nama: user?.nama || '',
    prodi: user?.prodi || '',
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    foto_profile: user?.foto_profile || ''
  });
  const fileRef = useRef();
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const cropCallbackRef = useRef(null);

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      cropCallbackRef.current = (cropped) => setProfileForm(p => ({ ...p, foto_profile: cropped }));
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...profileForm, skills })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil berhasil diperbarui!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' });
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' });
    }
  };

  return (
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

      {showCropModal && (
        <CropModal 
          imageSrc={cropSrc} 
          onCropDone={(cropped) => { cropCallbackRef.current(cropped); setShowCropModal(false); }} 
          onCancel={() => setShowCropModal(false)} 
        />
      )}
    </div>
  );
}
