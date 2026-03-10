const router = require('express').Router();
const passport = require('passport');
const c = require('../controllers/authController');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }), c.googleCallback);
router.post('/apple/callback', passport.authenticate('apple', { session: false }), c.appleCallback);

module.exports = router;
