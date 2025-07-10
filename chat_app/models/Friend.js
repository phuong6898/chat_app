const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted' },
    createdAt: { type: Date, default: Date.now }
});

// (Tùy chọn) chỉ cho phép lưu một lần mỗi cặp bạn
friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
