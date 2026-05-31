import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './TaskInbox.css';

const TaskInbox = ({ token, isOpen, onClose }) => {
    const [allTasks, setAllTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('TODO'); // TODO, IN_PROGRESS, DONE
    const [expandedTask, setExpandedTask] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchMyTasks();
        }
    }, [isOpen]);

    useEffect(() => {
        // Filter tasks whenever filter or allTasks change
        setTasks(allTasks.filter(task => task.status === filter));
    }, [filter, allTasks]);

    const fetchMyTasks = async () => {
        setLoading(true);
        try {
            const query = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/tasks`;
            
            const response = await fetch(query, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (Array.isArray(data)) {
                setAllTasks(data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tasks/${taskId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            const data = await response.json();
            if (response.ok) {
                Swal.fire('Sukses!', 'Status tugas berhasil diperbarui', 'success');
                fetchMyTasks();
            } else {
                Swal.fire('Error', data.message || 'Gagal memperbarui status', 'error');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Swal.fire('Error', 'Gagal memperbarui status', 'error');
        }
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() && dueDate;
    };

    if (!isOpen) return null;

    return (
        <div className="task-inbox-overlay">
            <div className="task-inbox">
                <div className="ti-header">
                    <h2>✅ Kotak Tugas</h2>
                    <button className="ti-close" onClick={onClose}>✕</button>
                </div>

                <div className="ti-filter">
                    <button 
                        className={`filter-btn ${filter === 'TODO' ? 'active' : ''}`}
                        onClick={() => setFilter('TODO')}
                    >
                        ⏳ Tertunda
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
                        onClick={() => setFilter('IN_PROGRESS')}
                    >
                        ⚙️ Berjalan
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'DONE' ? 'active' : ''}`}
                        onClick={() => setFilter('DONE')}
                    >
                        ✅ Selesai
                    </button>
                </div>

                <div className="ti-list">
                    {loading ? (
                        <div className="loading">Memuat...</div>
                    ) : tasks.length === 0 ? (
                        <div className="empty">Tidak ada tugas</div>
                    ) : (
                        tasks.map(task => (
                            <div 
                                key={task.id} 
                                className={`task-item ${expandedTask === task.id ? 'expanded' : ''}`}
                            >
                                <div 
                                    className="task-header"
                                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                                >
                                    <div className="task-title-section">
                                        <h4>{task.judul_tugas}</h4>
                                        <span className="task-community">📍 {task.nama_komunitas} ({task.project_name})</span>
                                    </div>
                                    <div className="task-badges">
                                        {task.submission_status === 'APPROVED' && (
                                            <span className="status-badge" style={{ backgroundColor: '#4caf50' }}>✅ Disetujui</span>
                                        )}
                                        {task.submission_status === 'REJECTED' && (
                                            <span className="status-badge" style={{ backgroundColor: '#ff4444' }}>❌ Ditolak</span>
                                        )}
                                        {isOverdue(task.end_date) && task.status !== 'DONE' && (
                                            <span className="overdue-badge">⚠️ Terlambat</span>
                                        )}
                                    </div>
                                </div>

                                {expandedTask === task.id && (
                                    <div className="task-details">
                                        <div className="task-description">
                                            <strong>Deskripsi:</strong>
                                            <p>{task.deskripsi || 'Tidak ada deskripsi'}</p>
                                        </div>

                                        <div className="task-metadata">
                                            {task.end_date && (
                                                <div className="metadata-row">
                                                    <span className="label">Tenggat Proyek:</span>
                                                    <span>{new Date(task.end_date).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            )}
                                            {task.ketua_note && (
                                                <div className="metadata-row">
                                                    <span className="label">Catatan Ketua:</span>
                                                    <span>{task.ketua_note}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-actions">
                                            {task.status !== 'DONE' && (
                                                <>
                                                    {task.status === 'TODO' && (
                                                        <button 
                                                            className="action-btn start"
                                                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                                        >
                                                            ⚙️ Mulai Kerjakan
                                                        </button>
                                                    )}
                                                    {task.status === 'IN_PROGRESS' && (
                                                        <button 
                                                            className="action-btn complete"
                                                            onClick={() => window.location.href = '/portfolio'}
                                                        >
                                                            📤 Kumpulkan di Portofolio
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskInbox;
