const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Biến toàn cục lưu OTP tạm thời (demo, production nên dùng cache hoặc DB)
const resetCodes = {};

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { username, email, password, avatar } = req.body;

        // Kiểm tra username hoặc email đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username hoặc email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, avatar });

        await user.save();

        console.log('Đăng ký thành công:', req.body);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username hoặc email đã tồn tại (duplicate key)' });
        }
        res.status(500).json({ error: 'Đã có lỗi xảy ra trên server: ' + err.message });
    }
};

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

exports.sendResetCode = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        if (!user || !user.email) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản hoặc email' });
        }
        // Sinh mã OTP 6 số
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Lưu vào biến toàn cục với hạn 10 phút
        resetCodes[username] = { code, expires: Date.now() + 10 * 60 * 1000 };

        // Gửi email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Mã xác nhận đặt lại mật khẩu',
            text: `Mã xác nhận của bạn là: ${code}`
        });
        res.json({ message: 'Đã gửi mã xác nhận đến email' });
    } catch (err) {
        console.error('Send reset code error:', err);
        res.status(500).json({ error: 'Không thể gửi mã xác nhận' });
    }
};

exports.verifyResetCode = async (req, res) => {
    try {
        const { username, code } = req.body;
        const entry = resetCodes[username];
        if (!entry || entry.code !== code) {
            return res.status(400).json({ error: 'Mã xác nhận không đúng' });
        }
        if (Date.now() > entry.expires) {
            delete resetCodes[username];
            return res.status(400).json({ error: 'Mã xác nhận đã hết hạn' });
        }
        res.json({ message: 'Mã xác nhận hợp lệ' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xác thực mã' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { username, code, newPassword } = req.body;
        const entry = resetCodes[username];
        if (!entry || entry.code !== code) {
            return res.status(400).json({ error: 'Mã xác nhận không đúng' });
        }
        if (Date.now() > entry.expires) {
            delete resetCodes[username];
            return res.status(400).json({ error: 'Mã xác nhận đã hết hạn' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        delete resetCodes[username];
        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi đặt lại mật khẩu' });
    }
};
