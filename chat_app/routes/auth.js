const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, async (req, res) => {
    console.log('Auth route - Profile request from user:', req.user.userId);
    try {
        const user = await User.findById(req.user.userId).select('-password');
        console.log('Auth route - Found user:', user ? 'yes' : 'no');
        if (user) {
            console.log('Auth route - User data:', { _id: user._id, username: user.username });
        }
        res.json(user);
    } catch (error) {
        console.error('Auth route - Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
router.post('/refresh', async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);
    try {
        const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        // (có thể kiểm tra DB xem refreshToken hợp lệ)
        const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
        return res.json({ accessToken: newAccessToken });
    } catch {
        return res.sendStatus(403);
    }
});

module.exports = router;