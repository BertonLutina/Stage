const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { generateCodeVerifier, generateCodeChallenge } = require('../utils/pkce');

const KICK_AUTH_URL = 'https://id.kick.com/oauth/authorize';
const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token';
const KICK_API_URL = 'https://api.kick.com/public/v1/users';
const KICK_SCOPE = 'user:read';

async function authorize(req, res) {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  const callbackUrl = process.env.KICK_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    return res.status(500).json({ error: 'Kick OAuth not configured' });
  }

  const state = uuidv4();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: KICK_SCOPE,
    state: `${state}.${Buffer.from(codeVerifier).toString('base64url')}`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`${KICK_AUTH_URL}?${params.toString()}`);
}

async function callback(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  const callbackUrl = process.env.KICK_CALLBACK_URL;
  const redirectUrl = process.env.AUTH_CALLBACK_REDIRECT_URL;

  if (!code || !state) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=missing_params` : null;
    return errUrl ? res.redirect(errUrl) : res.status(400).json({ error: 'Missing code or state' });
  }

  const [statePart, verifierB64] = state.split('.');
  const codeVerifier = verifierB64 ? Buffer.from(verifierB64, 'base64url').toString() : null;

  if (!codeVerifier) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=invalid_state` : null;
    return errUrl ? res.redirect(errUrl) : res.status(400).json({ error: 'Invalid state' });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    code,
    code_verifier: codeVerifier,
  });

  let tokenRes;
  try {
    tokenRes = await fetch(KICK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=token_fetch_failed` : null;
    return errUrl ? res.redirect(errUrl) : res.status(502).json({ error: 'Failed to exchange token' });
  }

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=token_exchange_failed` : null;
    return errUrl ? res.redirect(errUrl) : res.status(400).json({ error: tokenData.error || 'Token exchange failed' });
  }

  let userRes;
  try {
    userRes = await fetch(KICK_API_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
  } catch (err) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=user_fetch_failed` : null;
    return errUrl ? res.redirect(errUrl) : res.status(502).json({ error: 'Failed to fetch user' });
  }

  const raw = await userRes.json();
  const kickUser = raw?.data ?? raw;
  const kickId = (kickUser?.id ?? kickUser?.user_id)?.toString() || '';
  const email = kickUser?.email || `${kickId || 'unknown'}@kick.user`;
  const displayName = kickUser?.username || kickUser?.slug || kickUser?.name || kickUser?.login || '';

  if (!kickId) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=no_user` : null;
    return errUrl ? res.redirect(errUrl) : res.status(400).json({ error: 'Could not get user from Kick' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE kick_id = ? OR email = ?', [kickId, email]);
    let user;

    if (rows.length > 0) {
      user = rows[0];
      if (!user.kick_id) {
        await pool.query('UPDATE users SET kick_id = ?, auth_provider = ? WHERE id = ?', [kickId, 'kick', user.id]);
      }
    } else {
      const newId = uuidv4();
      await pool.query(
        'INSERT INTO users (id, first_name, last_name, email, kick_id, auth_provider, gamer_tag) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newId, displayName, '', email, kickId, 'kick', displayName || null]
      );
      const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
      user = newUser[0];
      await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [newId]);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);

    if (redirectUrl) {
      const url = new URL(redirectUrl);
      url.searchParams.set('accessToken', accessToken);
      url.searchParams.set('refreshToken', refreshToken);
      url.searchParams.set('user', JSON.stringify(user));
      return res.redirect(url.toString());
    }
    res.json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    const errUrl = redirectUrl ? `${redirectUrl}?error=db_error` : null;
    return errUrl ? res.redirect(errUrl) : res.status(500).json({ error: 'Database error' });
  }
}

module.exports = { authorize, callback };
