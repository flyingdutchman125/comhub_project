import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import './NotificationCenter.css';

const NotificationCenter = ({ token, socket, isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('unread'); // unread, all

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch notifications when category changes
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchUnreadCounts();
        }
    }, [isOpen, selectedCategory, filter]);

    // Socket.IO listener for real-time notifications
    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (data) => {
                setNotifications(prev => [data, ...prev]);
                Swal.fire({
                    title: data.title,
                    text: data.message,
                    icon: 'info',
                    timer: 5000,
                    position: 'top-end',
                    showConfirmButton: false,
                    toast: true
                });
            });

            socket.on('task_notification', (data) => {
                Swal.fire({
                    title: data.title,
                    text: data.message,
                    icon: 'info',
                    timer: 5000,
                    position: 'top-end',
                    showConfirmButton: false,
                    toast: true
                });
            });

            socket.on('community_update', (data) => {
                console.log('Community update:', data);
                fetchNotifications(); // Refresh notifications
            });

            return () => {
                socket.off('new_notification');
                socket.off('task_notification');
                socket.off('community_update');
            };
        }
    }, [socket]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            let query = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications?limit=20`;
            
            if (selectedCategory) {
                query += `&categoryId=${selectedCategory}`;
            }

            if (filter === 'unread') {
                query += '&isRead=false';
            }

            const response = await fetch(query, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/unread/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                const counts = {};
                data.data.forEach(item => {
                    if (item.category_id > 0) {
                        counts[item.category_id] = item.unread_count;
                    }
                });
                setUnreadCounts(counts);
            }
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                fetchUnreadCounts();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categoryId: selectedCategory })
            });

            const data = await response.json();
            if (data.success) {
                fetchNotifications();
                fetchUnreadCounts();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                fetchUnreadCounts();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getTotalUnread = () => {
        return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    };

    if (!isOpen) return null;

    return (
        <div className="notification-center-overlay">
            <div className="notification-center">
                <div className="nc-header">
                    <h2>🔔 Notifikasi</h2>
                    <button className="nc-close" onClick={onClose}>✕</button>
                </div>

                <div className="nc-controls">
                    <div className="nc-filter">
                        <button 
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Belum Dibaca ({getTotalUnread()})
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Semua
                        </button>
                    </div>

                    {filter === 'unread' && notifications.length > 0 && (
                        <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                            Tandai Semua Dibaca
                        </button>
                    )}
                </div>

                <div className="nc-categories">
                    <button 
                        className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        Semua ({getTotalUnread()})
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.icon} {cat.name}
                            {unreadCounts[cat.id] > 0 && <span className="badge">{unreadCounts[cat.id]}</span>}
                        </button>
                    ))}
                </div>

                <div className="nc-list">
                    {loading ? (
                        <div className="loading">Memuat...</div>
                    ) : notifications.length === 0 ? (
                        <div className="empty">Tidak ada notifikasi</div>
                    ) : (
                        notifications.map(notif => (
                            <div 
                                key={notif.id} 
                                className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                            >
                                <div className="notif-content">
                                    <div className="notif-header">
                                        <h4>{notif.title}</h4>
                                        <span className="notif-time">
                                            {new Date(notif.created_at).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <p className="notif-message">{notif.message}</p>
                                    <div className="notif-meta">
                                        <span className="community">📍 {notif.community_name}</span>
                                        <span className="type">{notif.type_name}</span>
                                    </div>
                                </div>
                                <div className="notif-actions">
                                    {!notif.is_read && (
                                        <button 
                                            className="action-btn mark-read"
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            title="Tandai sebagai dibaca"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => handleDeleteNotification(notif.id)}
                                        title="Hapus"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
