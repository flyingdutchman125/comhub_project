import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import CropModal from '../CropModal';

export default function ProfileTab({ user }) {
  const skills = (user?.skills || []).join(', ');

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-white mb-6">Profil Saya</h2>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-6 mb-6">
          <div className="h-24 w-24 rounded-3xl overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
            {user?.foto_profile ? (
              <img src={user.foto_profile} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
            )}
          </div>
          <div>
            <h4 className="text-white font-medium">Foto Profil</h4>
            <p className="text-xs text-slate-400 mt-1">Hanya dapat dilihat. Untuk mengedit profil, silakan kunjungi menu Portofolio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
            <input type="text" value={user?.nama || ''} readOnly className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Program Studi</label>
            <input type="text" value={user?.prodi || ''} readOnly className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Keahlian</label>
          <input type="text" value={skills} readOnly className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Bio Singkat</label>
          <textarea value={user?.bio || ''} readOnly rows="3" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none resize-none cursor-not-allowed" />
        </div>
      </div>
    </div>
  );
}
