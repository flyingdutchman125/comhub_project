import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

export default function ProjectForum({ 
  discussions, 
  setDiscussions, 
  selectedProject, 
  currentUser, 
  token, 
  projectMembers, 
  taskBoard, 
  isKetuaOrSekretaris,
  activeTab 
}) {
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editMessageText, setEditMessageText] = useState('')
  const [mentionMenu, setMentionMenu] = useState({ show: false, query: '', index: 0 })
  const [mentionedUsers, setMentionedUsers] = useState([])

  const formatMessage = (msgText) => {
    if (!msgText) return '';
    return msgText.split(/(@[a-zA-Z0-9_ ]+)/g).map((part, i) => {
      if (part.startsWith('@')) return <strong key={i} className="text-blue-300 font-bold">{part}</strong>;
      return part;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage, mentions: mentionedUsers })
      })
      const data = await res.json()
      if (res.ok) {
        setNewMessage('')
        setMentionedUsers([])
        if (data.data) {
           setDiscussions(prev => {
             if (prev.some(d => d.id === data.data.id)) return prev;
             return [...prev, data.data];
           })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDiscussions(prev => prev.filter(d => d.id !== msgId));
    } catch (e) { console.error(e) }
  }

  const handleEditMessageSubmit = async (e, msgId) => {
    e.preventDefault();
    if (!editMessageText.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: editMessageText })
      });
      if (res.ok) {
        setDiscussions(prev => prev.map(d => d.id === msgId ? { ...d, message: editMessageText, is_edited: 1 } : d));
        setEditingMessageId(null);
      }
    } catch (e) { console.error(e) }
  }

  const handleMessageChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);
    if (match) {
      setMentionMenu({ show: true, query: match[1].toLowerCase(), index: match.index });
    } else {
      setMentionMenu({ show: false, query: '', index: 0 });
    }
  }

  const handleMentionSelect = (member) => {
    const textBeforeMention = newMessage.substring(0, mentionMenu.index);
    const textAfterMention = newMessage.substring(mentionMenu.index + mentionMenu.query.length + 1);
    setNewMessage(`${textBeforeMention}@${member.nama} ${textAfterMention}`);
    if (!mentionedUsers.includes(member.user_id)) {
      setMentionedUsers(prev => [...prev, member.user_id]);
    }
    setMentionMenu({ show: false, query: '', index: 0 });
  }

  useEffect(() => {
    if (activeTab === 'forum' && discussions.length > 0 && currentUser && selectedProject) {
      const unreadIds = discussions
        .filter(d => d.user_id !== currentUser.id && (!d.read_by || !d.read_by.includes(currentUser.nama)))
        .map(d => d.id);
        
      if (unreadIds.length > 0) {
        fetch(`http://localhost:3000/api/projects/${selectedProject.id}/discussions/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ messageIds: unreadIds })
        }).catch(console.error);
        
        setDiscussions(prev => prev.map(d => unreadIds.includes(d.id) ? { ...d, read_by: [...(d.read_by || []), currentUser.nama] } : d));
      }
    }
  }, [discussions, activeTab, currentUser, selectedProject, token, setDiscussions])

  useEffect(() => {
    if (!selectedProject) return

    const socket = io('http://localhost:3000')
    socket.emit('join_project', selectedProject.id)

    socket.on('new_message', (msg) => {
      setDiscussions(prev => {
        if (prev.some(d => d.id === msg.id)) return prev;
        return [...prev, msg];
      })
      
      if (currentUser && msg.user_id !== currentUser.id) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `Pesan baru dari ${msg.user_name}`,
          text: msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message,
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#fff',
          iconColor: '#06b6d4'
        })
      }
    })

    socket.on('message_updated', (data) => {
      setDiscussions(prev => prev.map(d => d.id === data.id ? { ...d, message: data.message, is_edited: 1 } : d))
    })

    socket.on('message_deleted', (data) => {
      setDiscussions(prev => prev.filter(d => d.id !== data.id))
    })

    socket.on('message_read', (data) => {
      setDiscussions(prev => prev.map(d => {
        if (data.messageIds.includes(d.id)) {
          const reads = d.read_by || [];
          if (!reads.includes(data.userName)) {
            return { ...d, read_by: [...reads, data.userName] };
          }
        }
        return d;
      }))
    })

    return () => {
      socket.disconnect()
    }
  }, [selectedProject, currentUser, setDiscussions])

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {discussions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-sm">Belum ada diskusi di proyek ini. Mulai obrolan!</p>
          </div>
        ) : (
          discussions.map(msg => {
            const isMe = currentUser && msg.user_id === currentUser.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && <span className="text-xs font-semibold text-cyan-400">{msg.user_name}</span>}
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.is_edited ? <span className="text-[10px] italic text-slate-500">(diedit)</span> : null}
                    {isMe && <span className="text-xs font-semibold text-emerald-400">Anda</span>}
                  </div>
                  
                  {editingMessageId === msg.id ? (
                    <form onSubmit={(e) => handleEditMessageSubmit(e, msg.id)} className="w-full flex gap-2 mt-1">
                      <input 
                        type="text" autoFocus value={editMessageText} onChange={e => setEditMessageText(e.target.value)}
                        className="flex-1 text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                      <button type="submit" className="text-xs bg-cyan-600 px-2 rounded text-white hover:bg-cyan-500">Simpan</button>
                      <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs bg-slate-700 px-2 rounded text-white hover:bg-slate-600">Batal</button>
                    </form>
                  ) : (
                    <div className="group relative">
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                        {formatMessage(msg.message)}
                      </div>
                      {isMe && (
                        <div className="hidden group-hover:flex absolute top-0 -left-16 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                          <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.message); }} className="p-1.5 hover:bg-slate-700 text-slate-300 transition" title="Edit">✏️</button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 transition" title="Hapus">🗑️</button>
                        </div>
                      )}
                    </div>
                  )}

                  {isMe && msg.read_by && msg.read_by.length > 0 && (
                    <div className="text-[9px] text-slate-500 mt-0.5 max-w-[200px] truncate" title={msg.read_by.join(', ')}>
                      Dibaca oleh: {msg.read_by.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-xl relative">
        {mentionMenu.show && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
            {projectMembers
              .filter(m => m.nama.toLowerCase().includes(mentionMenu.query))
              .map(m => (
                <button 
                  key={m.user_id || m.id} 
                  type="button"
                  onClick={() => handleMentionSelect(m)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                  <div className="font-semibold">{m.nama}</div>
                  <div className="text-xs text-slate-400">{m.community_role}</div>
                </button>
              ))}
            {projectMembers.filter(m => m.nama.toLowerCase().includes(mentionMenu.query)).length === 0 && (
              <div className="px-4 py-2 text-sm text-slate-500">Tidak ada anggota</div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleMessageChange}
            placeholder={
              (isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id)))) 
                ? "Ketik pesan (ketik @ untuk menandai)..." 
                : "Akses Read-Only: Anda tidak memiliki tugas di proyek ini."
            }
            disabled={!(isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id))))}
            className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button type="submit" 
            disabled={!newMessage.trim() || !(isKetuaOrSekretaris || (taskBoard && ['TODO', 'IN_PROGRESS', 'DONE'].some(col => (taskBoard.board[col] || []).some(t => t.assigned_to === currentUser?.id))))} 
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed">
            Kirim
          </button>
        </form>
      </div>
    </div>
  )
}
