# 📬 Fitur Notifikasi & Task Management - Dokumentasi Lengkap

## 📋 Daftar Isi
1. [Ringkasan Fitur](#ringkasan-fitur)
2. [Database Schema](#database-schema)
3. [Backend API](#backend-api)
4. [Frontend Components](#frontend-components)
5. [Socket.IO Events](#socketio-events)
6. [Cara Penggunaan](#cara-penggunaan)

---

## 🎯 Ringkasan Fitur

### ✅ Fitur Utama:

1. **Notification Center** 📬
   - Tampilkan notifikasi real-time untuk setiap perubahan komunitas
   - Filter notifikasi berdasarkan kategori (UKM, Financial, Forum, Event, Task, Member)
   - Filter notifikasi berdasarkan tipe (Task Assignment, Payment Reminder, Member Joined, dll)
   - Tandai notifikasi sebagai sudah dibaca
   - Hapus notifikasi yang tidak perlu
   - Hitung notifikasi belum dibaca per kategori

2. **Task Inbox** ✅
   - Tampilkan tugas yang ditugaskan kepada user
   - Filter berdasarkan status (Pending, In Progress, Completed)
   - Update status tugas secara real-time
   - Tambahkan catatan untuk setiap tugas
   - Lihat deadline dan prioritas tugas

3. **Kategori & Tipe Notifikasi** 🏷️
   - **UKM**: Member Joined, Member Left, Role Changed, UKM Approved, UKM Rejected
   - **Financial**: Payment Reminder, Payment Received, Report Generated, Budget Alert
   - **Forum**: New Message, Message Reply, Message Mentioned
   - **Event**: Event Created, Event Updated, Event Cancelled
   - **Task**: Task Assignment, Task Completed, Task Overdue
   - **Member**: Member Approval, Member Rating

---

## 🗄️ Database Schema

### Tabel: `notification_categories`
```
- id (INT, PRIMARY KEY)
- name (VARCHAR, UNIQUE) - Nama kategori
- description (TEXT) - Deskripsi
- icon (VARCHAR) - Icon emoji
- created_at (TIMESTAMP)
```

### Tabel: `notification_types`
```
- id (INT, PRIMARY KEY)
- name (VARCHAR, UNIQUE) - Nama tipe notifikasi
- category_id (INT, FK) - Referensi kategori
- description (TEXT)
- icon (VARCHAR)
- created_at (TIMESTAMP)
```

### Tabel: `notifications`
```
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FK) - Penerima notifikasi
- community_id (INT, FK) - Komunitas terkait
- type_id (INT, FK) - Tipe notifikasi
- title (VARCHAR) - Judul notifikasi
- message (TEXT) - Isi notifikasi
- data (JSON) - Data tambahan (optional)
- is_read (BOOLEAN, DEFAULT FALSE)
- read_at (TIMESTAMP, NULL)
- created_at (TIMESTAMP)

INDEX: idx_user_read (user_id, is_read)
INDEX: idx_created (created_at DESC)
```

### Tabel: `tasks`
```
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- community_id (INT, FK) - Komunitas tempat tugas
- assigned_by (INT, FK) - User yang assign tugas
- title (VARCHAR) - Judul tugas
- description (TEXT)
- priority (ENUM: LOW, MEDIUM, HIGH) - Prioritas
- status (ENUM: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- due_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

INDEX: idx_community (community_id)
INDEX: idx_status (status)
```

### Tabel: `task_assignments`
```
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- task_id (INT, FK) - Referensi tugas
- user_id (INT, FK) - User yang ditugaskan
- assigned_at (TIMESTAMP)
- completed_at (TIMESTAMP, NULL)
- notes (TEXT) - Catatan pengerjaan

UNIQUE KEY: unique_task_user (task_id, user_id)
```

### Tabel: `community_changes`
```
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- community_id (INT, FK) - Komunitas yang berubah
- changed_by (INT, FK) - User yang melakukan perubahan
- change_type (VARCHAR) - Tipe perubahan (member_joined, financial_updated, dll)
- description (TEXT) - Deskripsi perubahan
- old_value (JSON) - Nilai lama
- new_value (JSON) - Nilai baru
- created_at (TIMESTAMP)

INDEX: idx_community (community_id)
INDEX: idx_created (created_at DESC)
```

---

## 🔌 Backend API

### Notification Endpoints

**GET** `/api/notifications`
- Query params:
  - `categoryId` - Filter berdasarkan kategori
  - `typeId` - Filter berdasarkan tipe
  - `isRead` - Filter: true/false
  - `limit` (default: 20)
  - `offset` (default: 0)
- Response: Array notifikasi dengan pagination

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/notifications?categoryId=1&isRead=false"
```

**GET** `/api/notifications/unread/count`
- Response: Array dengan unread count per kategori

**GET** `/api/notifications/categories`
- Response: Array kategori dengan jumlah tipe

**GET** `/api/notifications/categories/:categoryId/types`
- Response: Array tipe notifikasi untuk kategori tertentu

**PUT** `/api/notifications/:notificationId/read`
- Mark single notification as read

**PUT** `/api/notifications/read-all`
- Body: `{ categoryId: number }` (optional)
- Mark all notifications as read

**DELETE** `/api/notifications/:notificationId`
- Delete notification

### Task Endpoints

**GET** `/api/tasks/community/:communityId`
- Query params:
  - `status` - PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  - `priority` - LOW, MEDIUM, HIGH
  - `limit`, `offset`
- Get semua tugas untuk komunitas

**GET** `/api/tasks/my/all`
- Query params:
  - `status`
  - `priority`
  - `communityId`
  - `limit`, `offset`
- Get tugas yang ditugaskan kepada user

**POST** `/api/tasks/:communityId`
- Body:
  ```json
  {
    "title": "Buat laporan keuangan",
    "description": "Laporan keuangan bulan Mei",
    "priority": "HIGH",
    "due_date": "2024-05-31",
    "assignToUsers": [5, 6, 7]
  }
  ```
- Requirement: User harus KETUA/SEKRETARIS/BENDAHARA

**PUT** `/api/tasks/:taskId/status`
- Body: `{ "status": "COMPLETED" }`
- Update status tugas

**PUT** `/api/tasks/:taskId/note`
- Body: `{ "notes": "Sudah selesai 80%, menunggu approval" }`
- Tambahkan catatan pada tugas

**DELETE** `/api/tasks/:taskId`
- Hapus tugas (hanya pembuat)

---

## 🎨 Frontend Components

### NotificationCenter.jsx
```jsx
import NotificationCenter from './components/NotificationCenter';

<NotificationCenter 
  token={authToken}
  socket={socketIO}
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
/>
```

**Features:**
- Real-time notification updates via Socket.IO
- Filter by category
- Filter by read status
- Mark as read / Mark all as read
- Delete notification
- Show unread count per category

### TaskInbox.jsx
```jsx
import TaskInbox from './components/TaskInbox';

<TaskInbox 
  token={authToken}
  isOpen={showTasks}
  onClose={() => setShowTasks(false)}
/>
```

**Features:**
- Filter tasks by status (Pending, In Progress, Completed)
- Expand task details
- Update task status
- Add notes to task
- Show priority and due date
- Show overdue indicator

---

## 🔌 Socket.IO Events

### Server Events:

**`join_user_notifications`**
```javascript
socket.emit('join_user_notifications', userId);
// User bergabung ke room untuk menerima notifikasi personal
```

**`join_community_notifications`**
```javascript
socket.emit('join_community_notifications', communityId);
// User bergabung ke room untuk menerima notifikasi komunitas
```

### Server Broadcasting:

**`new_notification`**
```javascript
socket.emit('send_notification', {
  userId: 5,
  communityId: 2,
  title: 'Anggota Baru Bergabung',
  message: 'John Doe telah bergabung dengan komunitas',
  type: 'MEMBER_JOINED'
});
```

**`task_notification`**
```javascript
socket.emit('task_assigned', {
  userId: 5,
  communityId: 2,
  taskTitle: 'Buat Laporan Keuangan',
  taskDescription: 'Laporan bulanan Mei'
});
```

**`community_update`**
```javascript
socket.emit('community_changed', {
  communityId: 2,
  changeType: 'MEMBER_JOINED',
  changeDescription: 'John Doe bergabung dengan komunitas',
  changedBy: 3
});
```

---

## 📖 Cara Penggunaan

### 1. Inisialisasi Database

```bash
cd comhub-backend
node migrate_community_visits.js  # Pastikan tables terbuat
node seed_notifications.js         # Seed categories & types
```

### 2. Setup Frontend Socket.IO

```jsx
// App.jsx atau main.jsx
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: authToken
  }
});

// Join notification rooms
socket.emit('join_user_notifications', userId);
socket.emit('join_community_notifications', communityId);
```

### 3. Tampilkan Notification Center & Task Inbox

```jsx
// App.jsx
import NotificationCenter from './components/NotificationCenter';
import TaskInbox from './components/TaskInbox';

export default function App() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  return (
    <>
      {/* Navbar dengan tombol notifikasi & tasks */}
      <nav>
        <button onClick={() => setShowNotifications(true)}>
          🔔 Notifikasi ({unreadCount})
        </button>
        <button onClick={() => setShowTasks(true)}>
          ✅ Tugas ({taskCount})
        </button>
      </nav>

      {/* Notification Center */}
      <NotificationCenter
        token={token}
        socket={socket}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Task Inbox */}
      <TaskInbox
        token={token}
        isOpen={showTasks}
        onClose={() => setShowTasks(false)}
      />
    </>
  );
}
```

### 4. Trigger Notifikasi dari Backend

```javascript
// Controller (contoh: communityController.js)
const notificationController = require('../controllers/notificationController');

// Ketika member join
await notificationController.createNotification(
  communityId,           // user_id
  communityId,           // community_id
  3,                    // type_id (Member Joined)
  'Anggota Baru Bergabung',
  'John Doe telah bergabung dengan komunitas',
  { memberName: 'John Doe' }
);

// Broadcast ke multiple users
const memberIds = [1, 2, 3, 4];
await notificationController.broadcastNotification(
  memberIds,
  communityId,
  3,
  'Anggota Baru',
  'Ada anggota baru yang bergabung',
  { memberCount: 5 }
);
```

### 5. Create Task & Assign

```javascript
// POST /api/tasks/:communityId
{
  "title": "Laporan Keuangan Mei",
  "description": "Buat laporan keuangan bulanan Mei dengan rinci",
  "priority": "HIGH",
  "due_date": "2024-05-31",
  "assignToUsers": [5, 6, 7]  // Array user IDs
}

// Response: Task created + Notifikasi otomatis sent ke assigned users
```

---

## 🚀 Testing

### Test Notification Flow:
1. Login sebagai user A (KETUA komunitas)
2. Open Notification Center
3. Login sebagai user B (anggota komunitas) di tab lain
4. User B join komunitas
5. User A harus menerima notifikasi real-time

### Test Task Flow:
1. Login sebagai KETUA
2. Create task dengan assign ke multiple users
3. Users menerima task notification
4. Login sebagai user yang di-assign
5. Open Task Inbox
6. Update task status → Complete
7. Lihat perubahan status di database

---

## 📊 Query Contoh

```sql
-- Lihat semua notifikasi untuk user
SELECT * FROM notifications 
WHERE user_id = 5 
ORDER BY created_at DESC;

-- Hitung notifikasi belum dibaca per kategori
SELECT nc.name, COUNT(*) as unread_count
FROM notifications n
JOIN notification_types ct ON n.type_id = ct.id
JOIN notification_categories nc ON ct.category_id = nc.id
WHERE n.user_id = 5 AND n.is_read = 0
GROUP BY nc.id;

-- Lihat tugas untuk user tertentu
SELECT * FROM tasks t
JOIN task_assignments ta ON t.id = ta.task_id
WHERE ta.user_id = 5
ORDER BY t.due_date ASC;

-- Track perubahan komunitas
SELECT * FROM community_changes
WHERE community_id = 2
ORDER BY created_at DESC;
```

---

## ⚙️ File yang Dibuat/Dimodifikasi

### Backend:
- ✅ `config/db.js` - Added notification tables
- ✅ `controllers/notificationController.js` - NEW
- ✅ `controllers/taskController.js` - NEW
- ✅ `routes/notificationRoutes.js` - NEW
- ✅ `routes/taskRoutes.js` - NEW
- ✅ `server.js` - Added Socket.IO handlers
- ✅ `migrate_community_visits.js` - Reused for migration
- ✅ `seed_notifications.js` - NEW

### Frontend:
- ✅ `src/components/NotificationCenter.jsx` - NEW
- ✅ `src/components/NotificationCenter.css` - NEW
- ✅ `src/components/TaskInbox.jsx` - NEW
- ✅ `src/components/TaskInbox.css` - NEW

---

## 🐛 Troubleshooting

### Notifikasi tidak muncul?
1. Pastikan Socket.IO terhubung: `console.log(socket.connected)`
2. Pastikan user join notification room: `socket.emit('join_user_notifications', userId)`
3. Check server logs untuk Socket.IO events

### Tasks tidak muncul?
1. Pastikan user di-assign ke task
2. Check apakah task ada di database: `SELECT * FROM task_assignments WHERE user_id = X`
3. Verify token masih valid

### Performa lambat?
1. Tambah INDEX pada tabel notifications dan tasks
2. Gunakan pagination (limit & offset)
3. Monitor database query time

---

## 📝 Catatan

- Notifikasi real-time memerlukan Socket.IO connection aktif
- Task notifications otomatis dikirim saat task di-assign
- Community changes dapat di-track melalui `community_changes` table
- Implementasi dapat di-extend dengan email notifications atau SMS

