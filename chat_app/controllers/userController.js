const User = require('../models/User');

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('_id username email avatarUrl createdAt');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');

router.get('/search', auth, usersController.searchUsers);
router.get('/:id', auth, usersController.getUserById); // Thêm dòng này

module.exports = router;