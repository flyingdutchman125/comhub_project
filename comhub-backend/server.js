const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const projectRoutes = require('./routes/projectRoutes');
const financeRoutes = require('./routes/financeRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Inject io to request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Agar bisa membaca body request berupa JSON dengan ukuran file base64 besar
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Route dasar untuk testing
app.get('/', (req, res) => {
    res.json({ message: 'Selamat datang di API ComHub!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', projectRoutes);
app.use('/api', financeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', attendanceRoutes);

// Socket.IO Events
io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);
    
    // Join room berdasarkan projectId
    socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`Socket ${socket.id} joined room: project_${projectId}`);
    });

    // Join notification room untuk user tertentu
    socket.on('join_user_notifications', (userId) => {
        socket.join(`user_notifications_${userId}`);
        console.log(`Socket ${socket.id} joined notification room for user: ${userId}`);
    });

    // Join community notifications room
    socket.on('join_community_notifications', (communityId) => {
        socket.join(`community_notifications_${communityId}`);
        console.log(`Socket ${socket.id} joined notification room for community: ${communityId}`);
    });

    // Send notification event
    socket.on('send_notification', (data) => {
        const { userId, communityId, title, message, type } = data;
        io.to(`user_notifications_${userId}`).emit('new_notification', {
            title,
            message,
            type,
            communityId,
            timestamp: new Date()
        });
    });

    // Send task assignment notification
    socket.on('task_assigned', (data) => {
        const { userId, communityId, taskTitle, taskDescription } = data;
        io.to(`user_notifications_${userId}`).emit('task_notification', {
            type: 'TASK_ASSIGNED',
            title: `Tugas Baru: ${taskTitle}`,
            message: taskDescription,
            communityId,
            timestamp: new Date()
        });
    });

    // Broadcast community change notification
    socket.on('community_changed', (data) => {
        const { communityId, changeType, changeDescription, changedBy } = data;
        io.to(`community_notifications_${communityId}`).emit('community_update', {
            type: 'COMMUNITY_CHANGE',
            changeType,
            description: changeDescription,
            changedBy,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Jalankan server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ComHub berjalan di port ${PORT}`);
});