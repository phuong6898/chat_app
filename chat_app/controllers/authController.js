const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const resetCodes = {};

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
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Lưu vào biến toàn cục với hạn 10 phút
        resetCodes[username] = { code, expires: Date.now() + 10 * 60 * 1000 };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: `"Chat App" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Chat App – Mã xác nhận đặt lại mật khẩu',
            text: `Chào ${user.username},\n\nCảm ơn bạn đã tham gia Chat App!\n\nMã xác nhận của bạn là: ${code}\n\nMã này có hiệu lực trong 10 phút.\nNếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.\n\nChúc bạn một ngày tốt lành,\nChat App Team`,
            html: `
              <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height:1.6; max-width:600px; margin:0 auto; padding:20px;">
                <h2 style="color:#4a90e2; margin-bottom:0.5em;">Chat App</h2>
                <p>Chào <strong>${user.username}</strong>,</p>
                <p>Cảm ơn bạn đã tham gia <strong>Chat App</strong>! Để tiếp tục đặt lại mật khẩu, vui lòng sử dụng mã xác nhận bên dưới:</p>
                <div style="background: #f5f8fa; border: 1px solid #e1e8ed; padding: 15px; text-align:center; margin: 20px 0; border-radius: 6px;">
                  <span style="font-size: 2em; font-weight: bold; color: #007bff;">${code}</span>
                </div>
                <p style="font-size:0.9em; color:#555;">Mã này có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
                <hr style="border:none; border-top:1px solid #e1e8ed; margin:30px 0;" />
                <p style="font-size:0.9em; color:#555;">Chúc bạn một ngày tốt lành,</p>
                <p style="font-size:0.9em; color:#555;"><strong>Chat App Team</strong></p>
              </div>
            `
          };
          console.log('Sending mail:', mailOptions); // ← debug
          await transporter.sendMail(mailOptions);
      
          return res.json({ message: 'Đã gửi mã xác nhận đến email' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Không thể gửi mã xác nhận' });
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
