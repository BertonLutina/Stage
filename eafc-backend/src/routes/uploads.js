const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { successResponse } = require('../utils/helpers');

router.post('/chat', auth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    return successResponse(res, { url, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
