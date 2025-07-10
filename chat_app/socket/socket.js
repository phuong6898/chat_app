const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Message = require('../models/Message');

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        } catch (err) {
            console.error('JWT verification error:', err);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);
        socket.join(`user_${socket.userId}`);
        console.log(`Socket ${socket.id} joined room user_${socket.userId}`);
        socket.broadcast.emit('userOnline', socket.userId);

        socket.on('joinRoom', async (roomId) => {
            try {
                // Kiểm tra user có trong room không
                const room = await Room.findById(roomId);

                // Kiểm tra cả dạng string và ObjectId
                const isMember = room.members.some(member =>
                    member.toString() === socket.userId ||
                    (member._id && member._id.toString() === socket.userId)
                );

                if (room && isMember) {
                    socket.join(roomId);
                    console.log(`User ${socket.userId} joined room ${roomId}`);
                } else {
                    console.log(`User ${socket.userId} not authorized to join room ${roomId}`);
                }
            } catch (err) {
                console.error('Join room error:', err);
            }
        });

        socket.on('roomMessage', async ({ roomId, content, tempId }) => {
            try {
                // TẠO VÀ LƯU TIN NHẮN
                const message = new Message({
                    sender: socket.userId,
                    room: roomId,
                    content,
                    timestamp: new Date()
                });

                await message.save();

                // POPULATE THÔNG TIN NGƯỜI GỬI - THÊM 'username'
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username avatarUrl');

                // THÊM TEMP ID VÀO PHẢN HỒI
                const responseMessage = {
                    ...populatedMessage.toObject(),
                    tempId // GỬI LẠI TEMP ID CHO FE
                };

                // GỬI TIN NHẮN ĐẾN PHÒNG
                io.to(roomId).emit('roomMessage', responseMessage);
            } catch (err) {
                console.error('Error sending room message:', err);
            }
        });
        socket.on('privateMessage', async ({ receiverId, content, tempId }, callback) => {
            try {
                console.log('Private message request:', { 
                    receiverId, 
                    receiverIdType: typeof receiverId,
                    content, 
                    tempId, 
                    senderId: socket.userId,
                    senderIdType: typeof socket.userId
                });
                
                const Friend = require('../models/Friend');
                // Kiểm tra quan hệ bạn bè
                const isFriend = await Friend.findOne({
                  $or: [
                    { user1: socket.userId, user2: receiverId, status: 'accepted' },
                    { user1: receiverId, user2: socket.userId, status: 'accepted' }
                  ]
                });
                
                console.log('Friend check query:', {
                  $or: [
                    { user1: socket.userId, user2: receiverId, status: 'accepted' },
                    { user1: receiverId, user2: socket.userId, status: 'accepted' }
                  ]
                });
                
                console.log('Friend check result:', isFriend);
                
                if (!isFriend) {
                  return callback({ error: 'You are not friends with this user' });
                }
                
                // Tạo và lưu tin nhắn
                const message = new Message({
                  sender: socket.userId,
                  receiver: receiverId,
                  content,
                  timestamp: new Date()
                });
                await message.save();
                
                console.log('Message saved:', message);
                
                // Populate thông tin người gửi
                const populatedMsg = await Message.populate(message, {
                  path: 'sender',
                  select: 'username avatarUrl'
                });
                
                console.log('Populated message:', populatedMsg);
                
                // Thêm tempId vào tin nhắn nếu có
                const messageWithTempId = {
                    ...populatedMsg.toObject(),
                    tempId
                };
                
                console.log('Sending message to rooms:', `user_${receiverId}`, `user_${socket.userId}`);
                
                // Gửi tin nhắn cho cả 2 bên
                io.to(`user_${receiverId}`).emit('privateMessage', messageWithTempId);
                io.to(`user_${socket.userId}`).emit('privateMessage', messageWithTempId);
                callback({ message: messageWithTempId });
            } catch (err) {
                console.error('Error sending private message:', err);
                callback({ error: 'Failed to send message' });
            }
        });

        // Tham gia phòng chat riêng
        socket.on('joinPrivateChat', (roomId) => {
            console.log(`User ${socket.userId} joined private room: ${roomId}`);
            socket.join(`private_${roomId}`);
        });

        socket.on('join', ({ room }) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room} (manual join)`);
        });

        // Ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            // Thông báo người dùng offline
            socket.broadcast.emit('userOffline', socket.userId);
        });
    });
};