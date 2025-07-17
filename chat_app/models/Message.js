const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    content: { type: String, required: true},
    timestamp: { type: Date, default: Date.now},
    recalled: { type: Boolean, default: false }, // Đánh dấu đã thu hồi
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách user đã xóa một phía
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Danh sách user đã đọc
},{
    timestamps: true // Thêm option này để tự động tạo createdAt, updatedAt
});
module.exports = mongoose.model('message', messageSchema);