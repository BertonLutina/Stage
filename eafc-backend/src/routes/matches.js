const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const c = require('../controllers/matchController');

router.get('/fixtures', c.getFixtures);
router.get('/:id/chat', optionalAuth, c.getMatchChat);
router.post('/:id/chat/read', auth, c.markMatchChatRead);
router.get('/:id', c.getMatch);
router.put('/:id/score', auth, c.updateScore);
router.put('/:id/schedule', auth, c.updateSchedule);
router.post('/:id/video', auth, c.addVideo);

module.exports = router;
