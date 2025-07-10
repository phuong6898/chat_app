const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

// Thêm middleware để log request
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

router.post('/', auth, roomController.createRoom);
router.post('/add-member', auth, roomController.addMember);
router.get('/', auth, roomController.getUserRooms);
router.get('/public', auth, roomController.getPublicRooms);

// Xử lý lỗi tập trung
router.use((err, req, res, next) => {
    console.error('Room route error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
module.exports = router;