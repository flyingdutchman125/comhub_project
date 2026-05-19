import { useState, useEffect, useCallback } from 'react'

export function InboxPage({ token, currentUser }) {
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
    fetchMessages()
  }, [fetchMessages])

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

  if (loading) return <div className="text-slate-400">Memuat pesan...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Kotak Pesan</h2>
      {messages.length === 0 ? (
        <p className="text-slate-400">Belum ada pesan.</p>
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
              
              {msg.type === 'PROMOTION_OFFER' && !msg.is_actioned && (
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={(e) => handleAccept(e, msg.id)}
                    className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    Terima Jabatan
                  </button>
                  <button 
                    onClick={(e) => handleReject(e, msg.id)}
                    className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition"
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
  )
}
