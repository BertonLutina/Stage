const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const teamOwner = require('../middleware/teamOwnerMiddleware');
const teamMember = require('../middleware/teamMemberMiddleware');
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
router.get('/:id/chat', auth, teamMember, c.getTeamChat);
router.post('/:id/leave', auth, c.leaveTeam);
router.post('/:id/join-request', auth, c.requestToJoin);
router.get('/:id/join-request-status', auth, c.getMyRequestStatus);
router.get('/:id/join-requests', auth, teamOwner, c.getJoinRequests);
router.post('/:id/join-requests/:requestId/accept', auth, teamOwner, c.acceptJoinRequest);
router.post('/:id/join-requests/:requestId/decline', auth, teamOwner, c.declineJoinRequest);

module.exports = router;
