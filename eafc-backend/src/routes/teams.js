const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const teamOwner = require('../middleware/teamOwnerMiddleware');
const upload = require('../middleware/uploadMiddleware');
const c = require('../controllers/teamController');

router.get('/with-members', c.listTeamsWithPlayers);
router.post('/', auth, upload.single('avatar'), c.createTeam);
router.get('/:id', c.getTeam);
router.put('/:id', auth, teamOwner, upload.single('avatar'), c.updateTeam);
router.get('/:id/players', c.getPlayers);
router.post('/:id/players', auth, teamOwner, c.addPlayer);
router.delete('/:id/players/:userId', auth, teamOwner, c.removePlayer);
router.get('/:id/formation', c.getFormation);
router.post('/:id/formation', auth, teamOwner, c.saveFormation);
router.get('/:id/dressing-room', c.getDressingRoom);

module.exports = router;
