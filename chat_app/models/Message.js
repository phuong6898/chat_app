const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    content: { type: String, required: true},
    timestamp: { type: Date, default: Date.now}
},{
    timestamps: true // Thêm option này để tự động tạo createdAt, updatedAt
});
module.exports = mongoose.model('message', messageSchema);