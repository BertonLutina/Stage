const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const c = require('../controllers/socialController');

router.post('/follows', auth, c.follow);
router.delete('/follows', auth, c.unfollow);
router.post('/posts', auth, upload.single('media'), c.createPost);
router.get('/feed', auth, c.getFeed);
router.post('/likes', auth, c.toggleLike);
router.post('/comments', auth, c.addComment);
router.get('/reels', c.getReels);
router.post('/reels', auth, upload.single('video'), c.createReel);
router.get('/messages', auth, c.getConversations);
router.get('/messages/:userId', auth, c.getMessages);
router.post('/messages', auth, c.sendMessage);

module.exports = router;
