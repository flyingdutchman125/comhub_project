import { useState } from 'react';
import ProfileTab from '../components/Settings/ProfileTab';
import SecurityTab from '../components/Settings/SecurityTab';
import CommunityTab from '../components/Settings/CommunityTab';
import AdminTab from '../components/Settings/AdminTab';

export function SettingsPage({ user, token, selectedCommunity, userRoleInSelected, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('Profil Saya');
  
  const tabs = ['Profil Saya', 'Keamanan Akun'];
  if (selectedCommunity && ['KETUA', 'SEKRETARIS'].includes(userRoleInSelected)) {
    tabs.push('Pengaturan Komunitas');
  }
  if (user?.role === 'KEMAHASISWAAN') {
    tabs.push('Registrasi Admin');
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
          <ProfileTab user={user} token={token} onProfileUpdated={onProfileUpdated} />
        )}
        
        {activeTab === 'Keamanan Akun' && (
          <SecurityTab token={token} />
        )}

        {activeTab === 'Pengaturan Komunitas' && selectedCommunity && (
          <CommunityTab token={token} selectedCommunity={selectedCommunity} />
        )}

        {activeTab === 'Registrasi Admin' && user?.role === 'KEMAHASISWAAN' && (
          <AdminTab token={token} />
        )}
      </div>
    </div>
  );
}
