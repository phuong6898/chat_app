const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// Gửi lời mời
exports.send = async (req, res) => {
    const from = req.user.userId;
    const  to  = req.body.to;
    const io   = req.app.get('io');

    if (from === to) return res.status(400).json({ error: 'Cannot add yourself' });

    try {
        const reqExist = await FriendRequest.findOne({ from, to });
        if (reqExist) return res.status(400).json({ error: 'Request already exists' });

        const fromUser = await User.findById(from).select('username');
        if (!fromUser) return res.status(404).json({ error: 'User not found' });

        const request = await FriendRequest.create({ from, to });
        io.to(`user_${to}`).emit('friendRequestReceived', {
            fromId:   from,
            fromUsername: fromUser.username,
            requestId: request._id
        });

        return res.status(201).json(request);
    }catch (err) {
        console.error('FriendRequest.send error:', err);
        // Xử lý duplicate key
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Request already exists' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Chấp nhận / Từ chối / Hủy request
exports.respond = async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'reject' | 'cancel'
    const io = req.app.get('io');
    try {
        const fr = await FriendRequest.findById(id);
        if (!fr) return res.status(404).json({ error: 'Not found' });

        // only `to` có thể accept/reject; only `from` có thể cancel
        if (action === 'cancel' && fr.from.toString() !== userId) {
            return res.status(403).json({ error: 'Not permitted' });
        }
        if ((action==='accept'||action==='reject') && fr.to.toString() !== userId) {
            return res.status(403).json({ error: 'Not permitted' });
        }

        if (action === 'cancel' || action === 'reject') {
            fr.status = action === 'cancel' ? 'cancelled' : 'rejected';
            await fr.save();
            return res.json(fr);
        }

        // action === 'accept'
        fr.status = 'accepted';
        await fr.save();
        // TẠO quan hệ bạn bè vĩnh viễn
        const Friend = require('../models/Friend');
        // đảm bảo user1 < user2 để luôn nhất quán
        const [u1,u2] = fr.from.toString() < fr.to.toString()
            ? [fr.from, fr.to] : [fr.to, fr.from];
        const friendRecord = await Friend.create({ user1: u1, user2: u2, status: 'accepted' });
        console.log('Friend relationship created:', friendRecord);
        console.log('Friend relationship types:', { 
            u1Type: typeof u1, 
            u2Type: typeof u2, 
            u1: u1, 
            u2: u2 
        });

        // Emit event cho người gửi
        const toUser = await User.findById(fr.to).select('username');
        const fromUser = await User.findById(fr.from).select('username');
        io.to(`user_${fr.from}`).emit('friendRequestAccepted', {
            byUsername: toUser.username,
            byId: toUser._id
        });
        io.to(`user_${fr.to}`).emit('friendRequestAccepted', {
            byUsername: fromUser.username,
            byId: fromUser._id
        });

        return res.json(fr);
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
};

// Lấy request đến / request đã gửi
exports.listReceived = (req, res) =>
    FriendRequest.find({ to: req.user.userId, status: 'pending' })
        .populate('from','username')
        .then(list => res.json(list));

exports.listSent = (req, res) =>
    FriendRequest.find({ from: req.user.userId, status: 'pending' })
        .populate('to','username')
        .then(list => res.json(list));
