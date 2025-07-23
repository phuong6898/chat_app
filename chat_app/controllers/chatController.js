const Message = require('../models/Message');
const Friend = require('../models/Friend');

// Lấy lịch sử chat 1-1
exports.getPrivateMessages = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.userId;

        console.log('Getting private messages between:', userId, 'and', friendId);
        console.log('Types:', { userIdType: typeof userId, friendIdType: typeof friendId });

        // Kiểm tra mối quan hệ bạn bè
        const isFriend = await Friend.findOne({
            $or: [
                { user1: userId, user2: friendId, status: 'accepted' },
                { user1: friendId, user2: userId, status: 'accepted' }
            ]
        });
        
        console.log('Chat controller - Friend check query:', {
            $or: [
                { user1: userId, user2: friendId, status: 'accepted' },
                { user1: friendId, user2: userId, status: 'accepted' }
            ]
        });

        console.log('Friend relationship found:', isFriend);

        if (!isFriend) {
            return res.status(403).json({ error: 'You are not friends with this user' });
        }

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        }).sort({ timestamp: 1 })
        .populate('sender', 'username avatar');

        console.log('Found messages:', messages.length);

        res.json(messages);
    } catch (err) {
        console.error('Error getting private messages:', err);
        res.status(500).json({ error: err.message });
    }
};

// Xóa tin nhắn
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Chỉ người gửi mới có thể xóa tin nhắn
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this message' });
        }

        await message.deleteOne();
        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};