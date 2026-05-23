const express = require('express');
const router = express.Router();
const {
    createSession,
    getSessions,
    getSessionDetails,
    updateSession,
    deleteSession,
    updateAttendanceRecords,
    getAttendanceSummary,
    markSelfPresent
} = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: Mendapatkan daftar sesi absensi komunitas
router.get('/communities/:communityId/attendance/sessions', verifyToken, getSessions);

// Endpoint: Membuat sesi absensi baru di komunitas
router.post('/communities/:communityId/attendance/sessions', verifyToken, createSession);

// Endpoint: Mendapatkan statistik ringkasan kehadiran seluruh anggota komunitas
router.get('/communities/:communityId/attendance/summary', verifyToken, getAttendanceSummary);

// Endpoint: Mendapatkan detail satu sesi absensi beserta daftar kehadiran anggotanya
router.get('/attendance/sessions/:sessionId', verifyToken, getSessionDetails);

// Endpoint: Memperbarui detail sesi absensi
router.put('/attendance/sessions/:sessionId', verifyToken, updateSession);

// Endpoint: Menghapus sesi absensi
router.delete('/attendance/sessions/:sessionId', verifyToken, deleteSession);

// Endpoint: Memperbarui rekam kehadiran anggota secara massal
router.put('/attendance/sessions/:sessionId/records', verifyToken, updateAttendanceRecords);

// Endpoint: Anggota melakukan absen mandiri
router.put('/attendance/sessions/:sessionId/self', verifyToken, markSelfPresent);

module.exports = router;
