const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const tournamentOwner = require('../middleware/tournamentOwnerMiddleware');
const c = require('../controllers/tournamentController');

router.post('/', auth, c.createTournament);
router.get('/:id', c.getTournament);
router.post('/:id/join', auth, c.joinTournament);
router.post('/:id/start', auth, tournamentOwner, c.startTournament);
router.get('/:id/brackets', c.getBrackets);
router.get('/:id/groups', c.getGroups);
router.get('/:id/standings', c.getStandings);

module.exports = router;
