const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat_app_avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage });

router.post('/avatar', upload.single('avatar'), (req, res) => {
  res.json({ url: req.file.path });
});

module.exports = router; 