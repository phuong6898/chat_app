const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friend: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// 👇 Đây là cách tránh lỗi OverwriteModelError:
module.exports =  mongoose.model('User', userSchema);
