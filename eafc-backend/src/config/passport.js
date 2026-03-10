const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const { pool } = require('./db');
const { v4: uuidv4 } = require('uuid');

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [
          profile.id,
          profile.emails[0].value,
        ]);

        if (rows.length > 0) {
          const user = rows[0];
          if (!user.google_id) {
            await pool.query('UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?', [
              profile.id, 'google', user.id,
            ]);
          }
          return done(null, user);
        }

        const newId = uuidv4();
        await pool.query(
          'INSERT INTO users (id, first_name, last_name, email, google_id, auth_provider, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newId, profile.name.givenName || '', profile.name.familyName || '', profile.emails[0].value, profile.id, 'google', profile.photos[0]?.value || null]
        );
        await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [newId]);
        const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
        return done(null, newUser[0]);
      } catch (err) {
        return done(err, null);
      }
    }));
  } else {
    console.warn('[Passport] Google OAuth disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set.');
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
      callbackURL: process.env.APPLE_CALLBACK_URL,
      passReqToCallback: false,
    }, async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        const appleId = idToken.sub;
        const email = idToken.email;

        const [rows] = await pool.query('SELECT * FROM users WHERE apple_id = ? OR email = ?', [appleId, email]);

        if (rows.length > 0) {
          const user = rows[0];
          if (!user.apple_id) {
            await pool.query('UPDATE users SET apple_id = ?, auth_provider = ? WHERE id = ?', [appleId, 'apple', user.id]);
          }
          return done(null, user);
        }

        const newId = uuidv4();
        await pool.query(
          'INSERT INTO users (id, first_name, last_name, email, apple_id, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
          [newId, '', '', email || '', appleId, 'apple']
        );
        await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [newId]);
        const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
        return done(null, newUser[0]);
      } catch (err) {
        return done(err, null);
      }
    }));
  } else {
    console.warn('[Passport] Apple OAuth disabled: APPLE_CLIENT_ID, APPLE_TEAM_ID, or APPLE_KEY_ID not set.');
  }

  return passport;
}

module.exports = configurePassport;
