const express = require('express');
const router = express.Router();
const friendRequestController = require('../controllers/friendRequestController');
const auth = require('../middleware/auth');

// Gửi lời mời kết bạn
router.post('/', auth,
    (req, res, next) => {
        req.io = req.app.get('io');
        next();
    },
    friendRequestController.send
);


// Chấp nhận / từ chối / hủy lời mời kết bạn
router.post('/:id/respond', auth, friendRequestController.respond);

// Lấy danh sách lời mời đã nhận
router.get('/received', auth, friendRequestController.listReceived);

// Lấy danh sách lời mời đã gửi
router.get('/sent', auth, friendRequestController.listSent);


module.exports = router;
