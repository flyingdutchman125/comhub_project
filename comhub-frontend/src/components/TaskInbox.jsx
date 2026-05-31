import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './TaskInbox.css';

const TaskInbox = ({ token, isOpen, onClose }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('PENDING'); // PENDING, IN_PROGRESS, COMPLETED
    const [expandedTask, setExpandedTask] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchMyTasks();
        }
    }, [isOpen, filter]);

    const fetchMyTasks = async () => {
        setLoading(true);
        try {
            const query = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tasks/my/all?status=${filter}&limit=20`;
            
            const response = await fetch(query, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setTasks(data.data);
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
            if (data.success) {
                Swal.fire('Sukses!', 'Status tugas berhasil diperbarui', 'success');
                fetchMyTasks();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Swal.fire('Error', 'Gagal memperbarui status', 'error');
        }
    };

    const handleAddNote = async (taskId) => {
        const { value: note } = await Swal.fire({
            title: 'Tambah Catatan',
            input: 'textarea',
            inputLabel: 'Catatan untuk tugas ini',
            inputPlaceholder: 'Tuliskan catatan Anda...',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal'
        });

        if (note) {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tasks/${taskId}/note`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ notes: note })
                    }
                );

                const data = await response.json();
                if (data.success) {
                    Swal.fire('Sukses!', 'Catatan berhasil ditambahkan', 'success');
                    fetchMyTasks();
                }
            } catch (error) {
                console.error('Error adding note:', error);
            }
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            'HIGH': '#ff4444',
            'MEDIUM': '#ff9800',
            'LOW': '#4caf50'
        };
        return <span className="priority-badge" style={{ backgroundColor: colors[priority] }}>{priority}</span>;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { color: '#2196f3', icon: '⏳', label: 'Tertunda' },
            'IN_PROGRESS': { color: '#ff9800', icon: '⚙️', label: 'Berjalan' },
            'COMPLETED': { color: '#4caf50', icon: '✅', label: 'Selesai' },
            'CANCELLED': { color: '#ccc', icon: '❌', label: 'Dibatalkan' }
        };
        const config = statusConfig[status] || {};
        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                {config.icon} {config.label}
            </span>
        );
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
                        className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setFilter('PENDING')}
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
                        className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
                        onClick={() => setFilter('COMPLETED')}
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
                                        <h4>{task.title}</h4>
                                        <span className="task-community">📍 {task.community_name}</span>
                                    </div>
                                    <div className="task-badges">
                                        {getPriorityBadge(task.priority)}
                                        {getStatusBadge(task.status)}
                                        {isOverdue(task.due_date) && (
                                            <span className="overdue-badge">⚠️ Terlambat</span>
                                        )}
                                    </div>
                                </div>

                                {expandedTask === task.id && (
                                    <div className="task-details">
                                        <div className="task-description">
                                            <strong>Deskripsi:</strong>
                                            <p>{task.description || 'Tidak ada deskripsi'}</p>
                                        </div>

                                        <div className="task-metadata">
                                            <div className="metadata-row">
                                                <span className="label">Dari:</span>
                                                <span>{task.assigned_by_name}</span>
                                            </div>
                                            {task.due_date && (
                                                <div className="metadata-row">
                                                    <span className="label">Deadline:</span>
                                                    <span>{new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            )}
                                            {task.notes && (
                                                <div className="metadata-row">
                                                    <span className="label">Catatan:</span>
                                                    <span>{task.notes}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="task-actions">
                                            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                                                <>
                                                    {task.status === 'PENDING' && (
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
                                                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                        >
                                                            ✅ Tandai Selesai
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="action-btn note"
                                                        onClick={() => handleAddNote(task.id)}
                                                    >
                                                        📝 Tambah Catatan
                                                    </button>
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
