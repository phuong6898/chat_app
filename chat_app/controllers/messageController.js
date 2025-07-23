const Room = require('../models/Room');
const Message = require('../models/Message');

exports.getRoomMessages = async (req, res) => {
    try {
        const {roomId} = req.params;
        const userId = req.user.userId;

        const room = await Room.findOne({
            _id: roomId,
            members: userId
        });
        if (!room) return res.status(403).json({ error: 'Access denied' });

        // Lấy tin nhắn
        const messages = await Message.find({ room: roomId })
            .populate('sender', 'username avatar')
            .sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error getting room messages:', err);
        res.status(500).json({error: 'Lỗi khi tải tin nhắn'});
    }
};

// Thu hồi hoặc xóa tin nhắn (áp dụng cho cả chat nhóm và chat riêng)
exports.recallOrDeleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Nếu đã thu hồi thì không làm gì nữa
        if (message.recalled) {
            return res.status(400).json({ error: 'Message already recalled' });
        }
        // Kiểm tra đã đọc chưa (chỉ cho phép thu hồi nếu readBy chỉ chứa sender hoặc rỗng)
        const isRead = message.readBy && message.readBy.some(id => id.toString() !== message.sender.toString());
        // Điều kiện thu hồi: chưa ai đọc (ngoại trừ người gửi)
        if (!isRead) {
            message.recalled = true;
            await message.save();
            return res.json({ message: 'Message recalled (hidden for all)' });
        } else {
            // Xóa một phía: thêm userId vào deletedBy
            if (!message.deletedBy) message.deletedBy = [];
            if (!message.deletedBy.includes(userId)) {
                message.deletedBy.push(userId);
                await message.save();
            }
            return res.json({ message: 'Message deleted for you only' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Đánh dấu tin nhắn đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body; // mảng id
        const userId = req.user.userId;
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ error: 'No messageIds provided' });
        }
        const updated = await Message.updateMany(
            { _id: { $in: messageIds }, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );
        // Emit socket event cho người gửi nếu là chat riêng
        const io = req.app.get('io');
        const messages = await Message.find({ _id: { $in: messageIds } });
        messages.forEach(msg => {
            if (msg.sender && msg.receiver && msg.sender.toString() !== userId) {
                // Gửi event cho người gửi biết tin nhắn đã được đọc
                io.to(`user_${msg.sender}`).emit('messageRead', {
                    messageId: msg._id,
                    readerId: userId
                });
            }
        });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};