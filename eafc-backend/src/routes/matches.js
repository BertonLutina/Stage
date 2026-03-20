const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/matchController');

router.get('/fixtures', c.getFixtures);
router.get('/:id/chat', c.getMatchChat);
router.get('/:id', c.getMatch);
router.put('/:id/score', auth, c.updateScore);
router.post('/:id/video', auth, c.addVideo);

module.exports = router;
