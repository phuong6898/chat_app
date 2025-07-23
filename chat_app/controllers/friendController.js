const Friend = require('../models/Friend');
const User   = require('../models/User');

// Danh sách bạn bè
exports.getAll = async (req, res) => {
    const userId = req.user.userId;
    console.log('Getting friends for user:', userId, 'Type:', typeof userId);
    
    const docs = await Friend.find({
        $or: [
            { user1: userId },
            { user2: userId }
        ]
    });
    console.log('Friend relationships found:', docs);
    
    // chuyển thành array các userId
    const ids = docs.map(f =>
        f.user1.toString()===userId ? f.user2 : f.user1
    );
    console.log('Friend IDs:', ids);
    
    const users = await User.find({ _id: { $in: ids } }).select('_id username avatar');
    console.log('Friend users:', users);
    
    return res.json(users);
};
