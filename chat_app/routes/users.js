// routes/users.js
const express = require('express');
const router = express.Router();
const { searchUsers, getUserById } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Thêm các package cho upload avatar
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'avatars' }
});
const parser = multer({ storage });

router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUserById);

// API upload avatar
router.put('/avatar', auth, parser.single('avatar'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    user.avatar = req.file.path; // URL Cloudinary
    await user.save();
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;