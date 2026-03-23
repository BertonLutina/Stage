const router = require('express').Router();
const passport = require('passport');
const c = require('../controllers/authController');
const kickController = require('../controllers/kickAuthController');

function requireOAuthConfig(provider, envVars) {
  return (req, res, next) => {
    const missing = envVars.filter((v) => !process.env[v]);
    if (missing.length) {
      return res.status(503).json({
        success: false,
        message: `${provider} OAuth not configured. Set ${missing.join(', ')} in backend .env`,
      });
    }
    next();
  };
}

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);

router.get('/google', requireOAuthConfig('Google', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL']), passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }), c.googleCallback);

router.post('/apple/callback', passport.authenticate('apple', { session: false }), c.appleCallback);

router.get('/twitch', requireOAuthConfig('Twitch', ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_CALLBACK_URL']), passport.authenticate('twitch', { session: false }));
router.get('/twitch/callback', passport.authenticate('twitch', { session: false, failureRedirect: '/auth/login' }), c.socialCallback('twitch'));

router.get('/discord', requireOAuthConfig('Discord', ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_CALLBACK_URL']), passport.authenticate('discord', { session: false }));
router.get('/discord/callback', passport.authenticate('discord', { session: false, failureRedirect: '/auth/login' }), c.socialCallback('discord'));

router.get('/kick', kickController.authorize);
router.get('/kick/callback', kickController.callback);

module.exports = router;
