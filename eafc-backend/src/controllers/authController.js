const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/helpers');
const { pool } = require('../config/db');

async function register(req, res, next) {
  try {
    const { first_name, last_name, email, password, country, country_code, phone_number, gamer_tag, birthday } = req.body;
    if (!password || password.length < 8) return errorResponse(res, 'Password must be at least 8 characters', 400);
    const existing = await userModel.findByEmail(email);
    if (existing) return errorResponse(res, 'Email already registered', 409);
    const password_hash = await bcrypt.hash(password, 12);
    const user = await userModel.create({ id: uuidv4(), first_name, last_name, email, password_hash, auth_provider: 'local', country, country_code, phone_number, gamer_tag, birthday });
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);
    return successResponse(res, { user, accessToken, refreshToken }, 'Registered', 201);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const identifier = email || req.body.identifier || req.body.emailOrGamerTag;
    if (!identifier) return errorResponse(res, 'Email or gamer tag required', 400);
    const userRow = await userModel.findByEmailOrGamerTag(identifier);
    if (!userRow) return errorResponse(res, 'Invalid credentials', 401);
    if (!userRow.password_hash) return errorResponse(res, 'Use social login for this account', 400);
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) return errorResponse(res, 'Invalid credentials', 401);
    const user = await userModel.findById(userRow.id);
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);
    return successResponse(res, { user, accessToken, refreshToken });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    const payload = verifyRefreshToken(refreshToken);
    const [rows] = await pool.query('SELECT id FROM refresh_tokens WHERE token = ? AND expires_at > NOW()', [refreshToken]);
    if (!rows.length) return errorResponse(res, 'Invalid refresh token', 401);
    const accessToken = generateAccessToken(payload.userId);
    return successResponse(res, { accessToken });
  } catch { return errorResponse(res, 'Invalid refresh token', 401); }
}

async function googleCallback(req, res) {
  const user = req.user;
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);
  res.json({ success: true, data: { user, accessToken, refreshToken } });
}

async function appleCallback(req, res) {
  const user = req.user;
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);
  res.json({ success: true, data: { user, accessToken, refreshToken } });
}

function socialCallback(provider) {
  return (req, res) => {
    const user = req.user;
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    pool.query('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [uuidv4(), user.id, refreshToken]);
    const redirect = process.env.AUTH_CALLBACK_REDIRECT_URL;
    if (redirect) {
      const url = new URL(redirect);
      url.searchParams.set('accessToken', accessToken);
      url.searchParams.set('refreshToken', refreshToken);
      url.searchParams.set('user', JSON.stringify(user));
      return res.redirect(url.toString());
    }
    res.json({ success: true, data: { user, accessToken, refreshToken } });
  };
}

module.exports = { register, login, refresh, googleCallback, appleCallback, socialCallback };
