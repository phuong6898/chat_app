require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friends');
const chatRoutes = require('./routes/chat');
const roomRoutes = require('./routes/rooms');
const setupSocket = require('./socket/socket');
const userRoutes = require('./routes/users');
const friendRequestRoutes = require('./routes/friendRequest');
const usersRouter = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

// Kết nối database
connectDB().then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors({origin: 'http://localhost:3000', credentials: true}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/chat', chatRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: "Chat API Server",
        endpoints: {
            auth: "/api/auth",
            friends: "/api/friends",
            rooms: "/api/rooms",
            chat: "/api/chat"
        }
    });
});

// Xử lý lỗi 404 (Route không tồn tại)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Xử lý lỗi server (500)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO
setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));