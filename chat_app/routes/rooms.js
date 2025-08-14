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
router.get('/', auth, roomController.getUserRooms);
router.get('/public', auth, roomController.getPublicRooms);
router.get('/:roomId', auth, roomController.getRoomDetails);
router.put('/:roomId', auth, roomController.updateRoom);
router.delete('/:roomId', auth, roomController.deleteRoom);

// Join/Leave Routes
router.post('/:roomId/join', auth, roomController.joinRoom);
router.delete('/:roomId/leave', auth, roomController.leaveRoom);

// Member Management Routes
router.post('/:roomId/members', auth, roomController.addMember);
router.delete('/:roomId/members/:userId', auth, roomController.removeMember);

// Join Request Routes
router.post('/:roomId/request-join', auth, roomController.requestJoinRoom);
router.post('/:roomId/requests/:requestId/approve', auth, roomController.approveJoinRequest);
router.post('/:roomId/requests/:requestId/reject', auth, roomController.rejectJoinRequest);

// Xử lý lỗi tập trung
router.use((err, req, res, next) => {
    console.error('Room route error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
module.exports = router;