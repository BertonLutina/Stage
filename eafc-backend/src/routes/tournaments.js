const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const tournamentOwner = require('../middleware/tournamentOwnerMiddleware');
const c = require('../controllers/tournamentController');

router.get('/list', c.listTournaments);
router.get('/time-slots', c.getTimeSlots);
router.post('/', auth, c.createTournament);
router.get('/:id', c.getTournament);
router.post('/:id/join', auth, c.joinTournament);
router.post('/:id/invite', auth, c.inviteTeams);
router.put('/:id/dates', auth, tournamentOwner, c.setDates);
router.post('/:id/start', auth, tournamentOwner, c.startTournament);
router.post('/:id/generate-schedule', auth, tournamentOwner, c.generateMatchSchedule);
router.post('/:id/randomize-schedule', auth, tournamentOwner, c.randomizeMatchSchedule);
router.get('/:id/brackets', c.getBrackets);
router.get('/:id/groups', c.getGroups);
router.get('/:id/standings', c.getStandings);

module.exports = router;
