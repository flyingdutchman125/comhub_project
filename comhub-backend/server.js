const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const projectRoutes = require('./routes/projectRoutes');
const financeRoutes = require('./routes/financeRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Agar bisa membaca body request berupa JSON

// Route dasar untuk testing
app.get('/', (req, res) => {
    res.json({ message: 'Selamat datang di API ComHub!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', projectRoutes);
app.use('/api', financeRoutes);

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server ComHub berjalan di http://localhost:${PORT}`);
});