const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Lấy tin nhắn riêng giữa 2 user
router.get('/private/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    console.log('Chat route - Getting private messages between:', userId, 'and', friendId);
    console.log('Chat route - Types:', { userIdType: typeof userId, friendIdType: typeof friendId });

    // Kiểm tra quan hệ bạn bè
    const Friend = require('../models/Friend');
    const isFriend = await Friend.findOne({
      $or: [
        { user1: userId, user2: friendId, status: 'accepted' },
        { user1: friendId, user2: userId, status: 'accepted' }
      ]
    });
    
    console.log('Chat route - Friend check query:', {
      $or: [
        { user1: userId, user2: friendId, status: 'accepted' },
        { user1: friendId, user2: userId, status: 'accepted' }
      ]
    });

    console.log('Chat route - Friend relationship found:', isFriend);

    if (!isFriend) {
      return res.status(403).json({ error: 'You are not friends with this user' });
    }

    // Lấy tin nhắn giữa 2 user
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username avatarUrl');

    console.log('Chat route - Found messages:', messages.length);

    res.json(messages);
  } catch (err) {
    console.error('Chat route - Error getting private messages:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;