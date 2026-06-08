import React, { useState } from 'react';

const apiDocsData = [
  {
    category: "Introduction",
    description: "Selamat datang di dokumentasi API ComHub. API ini berbasis REST dan menggunakan JSON untuk request dan response. Untuk mengakses endpoint yang dilindungi, Anda harus menyertakan JWT token di header Authorization: Bearer <token>.",
    endpoints: []
  },
  {
    category: "Authentication",
    description: "Endpoint untuk mengelola otentikasi pengguna.",
    endpoints: [
      {
        id: "auth-login",
        name: "Login",
        method: "POST",
        path: "/api/auth/login",
        description: "Autentikasi pengguna menggunakan email/username dan password untuk mendapatkan JWT token.",
        requestBody: `{\n  "identifier": "user@example.com",\n  "password": "yourpassword123"\n}`,
        response: `{\n  "message": "Login berhasil",\n  "token": "eyJhbGciOiJIUzI1NiIsIn...",\n  "user": {\n    "id": 1,\n    "username": "johndoe",\n    "email": "user@example.com",\n    "role": "MAHASISWA"\n  }\n}`
      },
      {
        id: "auth-register",
        name: "Register",
        method: "POST",
        path: "/api/auth/register",
        description: "Mendaftarkan pengguna baru ke dalam platform.",
        requestBody: `{\n  "username": "johndoe",\n  "email": "user@example.com",\n  "password": "yourpassword123",\n  "fullname": "John Doe",\n  "nim": "123456789"\n}`,
        response: `{\n  "message": "Registrasi berhasil"\n}`
      }
    ]
  },
  {
    category: "Communities",
    description: "Endpoint untuk mengelola komunitas (UKM, Hima, dsb) dan pendaftaran anggota.",
    endpoints: [
      {
        id: "comm-get-all",
        name: "Get All Communities",
        method: "GET",
        path: "/api/communities",
        description: "Mendapatkan daftar semua komunitas yang telah disetujui beserta statistik anggotanya.",
        requestBody: null,
        response: `[\n  {\n    "id": 1,\n    "nama_komunitas": "UKM Programming",\n    "deskripsi": "Komunitas untuk programmer mahasiswa.",\n    "tipe_komunitas": "UKM",\n    "status_persetujuan": "DISETUJUI",\n    "memberCount": 42\n  }\n]`
      },
      {
        id: "comm-create",
        name: "Create Community",
        method: "POST",
        path: "/api/communities",
        description: "Membuat pengajuan komunitas baru. Memerlukan autentikasi.",
        requestBody: `{\n  "nama_komunitas": "UKM Robotika",\n  "deskripsi": "Fokus pada pengembangan robot.",\n  "tipe_komunitas": "UKM",\n  "dosen_pembina_id": 5\n}`,
        response: `{\n  "message": "Komunitas berhasil dibuat, menunggu persetujuan",\n  "communityId": 2\n}`
      },
      {
        id: "comm-join",
        name: "Join Community",
        method: "POST",
        path: "/api/communities/:id/join",
        description: "Mengajukan diri untuk bergabung ke sebuah komunitas. Memerlukan autentikasi.",
        requestBody: `{\n  "alasan_bergabung": "Saya sangat tertarik dengan robotika dan ingin belajar."\n}`,
        response: `{\n  "message": "Berhasil mendaftar, menunggu persetujuan"\n}`
      }
    ]
  },
  {
    category: "News",
    description: "Endpoint untuk mengelola berita di dashboard komunitas.",
    endpoints: [
      {
        id: "news-get",
        name: "Get News",
        method: "GET",
        path: "/api/news",
        description: "Mendapatkan daftar berita terbaru.",
        requestBody: null,
        response: `[\n  {\n    "id": 1,\n    "title": "Pendaftaran Anggota Baru Dibuka!",\n    "content": "Silakan mendaftar...",\n    "author": "Admin BEM",\n    "created_at": "2026-06-01T10:00:00Z"\n  }\n]`
      }
    ]
  }
];

const MethodBadge = ({ method }) => {
  const colors = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  return (
    <span className={`px-2 py-1 text-xs font-bold rounded-md border ${colors[method] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {method}
    </span>
  );
};

export const ApiDocsPage = () => {
  const [activeCategory, setActiveCategory] = useState(apiDocsData[0].category);

  const activeData = apiDocsData.find(cat => cat.category === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#060b1b]/50 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-4">API Reference</h2>
          <nav className="space-y-1">
            {apiDocsData.map((item) => (
              <button
                key={item.category}
                onClick={() => setActiveCategory(item.category)}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                  ${activeCategory === item.category 
                    ? 'bg-cyan-500/10 text-cyan-400 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
              >
                {item.category}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="border-b border-slate-800/60 pb-8">
            <h1 className="text-3xl font-bold text-white mb-4">{activeData.category}</h1>
            <p className="text-slate-400 text-lg leading-relaxed">{activeData.description}</p>
          </div>

          {/* Endpoints List */}
          <div className="space-y-12 pb-12">
            {activeData.endpoints.map((endpoint) => (
              <div key={endpoint.id} id={endpoint.id} className="scroll-mt-8">
                
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-xl font-semibold text-slate-100">{endpoint.name}</h3>
                </div>
                
                <p className="text-slate-400 mb-6">{endpoint.description}</p>

                <div className="bg-[#060b1b] rounded-2xl border border-slate-800/60 overflow-hidden shadow-lg">
                  {/* Endpoint Path Banner */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border-b border-slate-800/60">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-slate-300 font-mono text-sm">{endpoint.path}</code>
                  </div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request Payload */}
                    {endpoint.requestBody && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Body (JSON)</div>
                        <div className="bg-slate-950 rounded-xl border border-slate-800/50 p-4 overflow-x-auto relative group">
                          <button 
                            onClick={() => navigator.clipboard.writeText(endpoint.requestBody)}
                            className="absolute top-3 right-3 text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                          <pre className="text-sm font-mono text-emerald-300 leading-relaxed">
                            {endpoint.requestBody}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Response Payload */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Example Response</div>
                      <div className="bg-slate-950 rounded-xl border border-slate-800/50 p-4 overflow-x-auto relative group h-full">
                        <button 
                          onClick={() => navigator.clipboard.writeText(endpoint.response)}
                          className="absolute top-3 right-3 text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <pre className="text-sm font-mono text-cyan-300 leading-relaxed">
                          {endpoint.response}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            
            {activeData.endpoints.length === 0 && activeData.category !== "Introduction" && (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                Dokumentasi untuk endpoint ini sedang dalam pengerjaan.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
