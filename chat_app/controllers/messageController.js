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
            .populate('sender', 'username avatarUrl')
            .sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error getting room messages:', err);
        res.status(500).json({error: 'Lỗi khi tải tin nhắn'});
    }
};