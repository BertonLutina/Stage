const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const c = require('../controllers/userController');

router.get('/:id', c.getProfile);
router.put('/:id', auth, upload.single('avatar'), c.updateProfile);
router.get('/:id/stats', c.getStats);
router.get('/:id/availability', c.getAvailability);
router.put('/:id/availability', auth, c.setAvailability);

module.exports = router;
