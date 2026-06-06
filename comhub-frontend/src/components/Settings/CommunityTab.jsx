import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import CropModal from '../CropModal';

export default function CommunityTab({ token, selectedCommunity }) {
  const [communityForm, setCommunityForm] = useState({
    nama_komunitas: selectedCommunity?.nama_komunitas || selectedCommunity?.name || '',
    deskripsi: selectedCommunity?.deskripsi || '',
    logo: selectedCommunity?.logo || ''
  });
  
  const commFileRef = useRef();
  const [showCommCropModal, setShowCommCropModal] = useState(false);
  const [commCropSrc, setCommCropSrc] = useState(null);
  const commCropCallbackRef = useRef(null);

  useEffect(() => {
    if (selectedCommunity) {
      setCommunityForm({
        nama_komunitas: selectedCommunity.nama_komunitas || selectedCommunity.name || '',
        deskripsi: selectedCommunity.deskripsi || '',
        logo: selectedCommunity.logo || ''
      });
    }
  }, [selectedCommunity]);

  const handleCommLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCommCropSrc(ev.target.result);
      commCropCallbackRef.current = (cropped) => setCommunityForm(p => ({ ...p, logo: cropped }));
      setShowCommCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCommunity = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/communities/${selectedCommunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(communityForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan komunitas berhasil diperbarui!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' });
    }
  };

  return (
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

      {showCommCropModal && (
        <CropModal 
          imageSrc={commCropSrc} 
          aspect={1}
          onCropDone={(cropped) => { commCropCallbackRef.current(cropped); setShowCommCropModal(false); }} 
          onCancel={() => setShowCommCropModal(false)} 
        />
      )}
    </div>
  );
}
