const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

// Lấy danh sách bạn bè
router.get('/', auth, friendController.getAll);

module.exports = router;
