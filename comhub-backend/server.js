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

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Jalankan server
server.listen(PORT, () => {
    console.log(`Server ComHub berjalan di http://localhost:${PORT}`);
});