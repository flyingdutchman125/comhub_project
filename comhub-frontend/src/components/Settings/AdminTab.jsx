import { useState } from 'react';
import Swal from 'sweetalert2';

export default function AdminTab({ token }) {
  const [adminForm, setAdminForm] = useState({ nama: '', email: '', password: '', role: 'DOSEN' });

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, background: '#0f172a', color: '#fff', confirmButtonColor: '#06b6d4' });
      setAdminForm({ nama: '', email: '', password: '', role: 'DOSEN' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#0f172a', color: '#fff' });
    }
  };

  return (
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
  );
}
