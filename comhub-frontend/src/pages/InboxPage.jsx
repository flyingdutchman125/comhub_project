import { useState, useEffect, useCallback } from 'react'

export function InboxPage({ token, currentUser, isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/messages/inbox', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isOpen === undefined || isOpen) {
      fetchMessages()
    }
  }, [fetchMessages, isOpen])

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/messages/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, is_read: 1 } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAccept = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:3000/api/messages/${id}/accept-promotion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        alert('Berhasil menerima tawaran dan keluar dari komunitas lain!');
        fetchMessages();
        window.location.reload(); // Reload to refresh global user state
      } else {
        alert(data.message || 'Gagal menerima tawaran');
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3000/api/messages/${id}/reject-promotion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchMessages();
    } catch (err) {
      console.error(err)
    }
  }

  if (isOpen !== undefined && !isOpen) return null;

  const content = (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white">Kotak Pesan</h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl p-2">
            ✕
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-slate-400 text-center py-8">Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Belum ada pesan.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  msg.is_read ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-800 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                }`}
                onClick={() => { if (!msg.is_read) markAsRead(msg.id) }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className={`font-semibold ${msg.is_read ? 'text-slate-300' : 'text-white'}`}>{msg.subject}</h3>
                    <p className="text-xs text-slate-400">Dari: {msg.sender_name}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(msg.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p className={`text-sm mt-3 whitespace-pre-wrap ${msg.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                  {msg.content}
                </p>
                {msg.type === 'TASK_SUBMISSION' && (
                  <div className="mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-300">
                    Buka Project Tracking untuk meninjau dan menyetujui pengumpulan tugas ini.
                  </div>
                )}
                {msg.type === 'TASK_REVIEW' && (
                  <div className={`mt-3 rounded-lg px-3 py-2 text-xs border ${msg.subject?.includes('Disetujui') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                    {msg.subject?.includes('Disetujui') ? 'Tugas Anda telah disetujui dan masuk ke Portofolio!' : 'Tugas ditolak — kumpulkan ulang di halaman Portofolio.'}
                  </div>
                )}
                
                {msg.type === 'PROMOTION_OFFER' && !msg.is_actioned && (
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={(e) => handleAccept(e, msg.id)}
                      className="flex-1 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                    >
                      Terima Jabatan
                    </button>
                    <button 
                      onClick={(e) => handleReject(e, msg.id)}
                      className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (isOpen !== undefined) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[10000] flex justify-end" style={{ animation: 'fadeIn 0.3s' }}>
        <div className="w-full max-w-md bg-slate-950 h-full p-6 shadow-[-4px_0_15px_rgba(0,0,0,0.5)] border-l border-slate-800" style={{ animation: 'slideInRight 0.3s ease-out' }}>
          {content}
        </div>
      </div>
    )
  }

  return content;
}

