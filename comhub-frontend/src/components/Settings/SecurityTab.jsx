import { useState } from 'react';
import Swal from 'sweetalert2';

export default function SecurityTab({ token }) {
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire({ icon: 'error', title: 'Gagal', text: 'Konfirmasi password baru tidak cocok!', background: '#0f172a', color: '#fff' });
    }
    try {
      const res = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password berhasil diubah!', background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' });
    }
  };

  return (
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
  );
}
