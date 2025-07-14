const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra username đã tồn tại chưa
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username đã tồn tại' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });

        // Lưu user mới
        await user.save();

        console.log('Đăng ký thành công:', req.body);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        // Bắt lỗi duplicate key từ MongoDB
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username đã tồn tại (duplicate key)' });
        }

        // Lỗi không xác định
        res.status(500).json({ error: 'Đã có lỗi xảy ra trên server: ' + err.message });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    console.log('Login request body:', req.body);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/api/auth/refresh' })
            .status(200)
            .json({ accessToken });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
};
