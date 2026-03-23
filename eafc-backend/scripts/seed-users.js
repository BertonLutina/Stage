#!/usr/bin/env node
/**
 * Seed 11 users for Stage platform.
 * Run: node scripts/seed-users.js
 * Requires: .env with DB config, or set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const USERS = [
  { first: 'Lengarose', last: 'User', gamer_tag: 'lengarose', pos: 'MID', password: '12345678' },
  { first: 'Denis', last: 'Lumbala', gamer_tag: 'RomeoDNS', pos: 'MID' },
  { first: 'Johan', last: 'de donckere', gamer_tag: 'thecallme_ddz', pos: 'MID' },
  { first: 'Elia', last: 'Kabanda', gamer_tag: 'eliakabanda', pos: 'ATT' },
  { first: 'Gaetan Lasong', last: 'Junior', gamer_tag: 'Lasongjr222', pos: 'ATT' },
  { first: 'Karmi', last: 'Karmi', gamer_tag: 'Godkiz99', pos: 'MID' },
  { first: 'IDeal', last: 'IDeal', gamer_tag: 'Ideal22', pos: 'ATT' },
  { first: 'Left', last: 'Right', gamer_tag: 'leftright', pos: 'DEF' },
  { first: 'Slim', last: 'Slim', gamer_tag: 'Milsserig', pos: 'DEF' },
  { first: 'Nelsokba', last: 'Nelsokba', gamer_tag: 'nelsonkba', pos: 'ATT' },
  { first: 'yekkeB', last: 'yekkeB', gamer_tag: 'JayBelkhri', pos: 'ATT' },
  { first: 'Aurele', last: 'Beya', gamer_tag: 'Ballieman', pos: 'DEF' },
];

const DEFAULT_PASSWORD = 'Stage2025!';

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eafc_platform',
    waitForConnections: true,
  });

  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const password = u.password || DEFAULT_PASSWORD;
    const password_hash = await bcrypt.hash(password, 12);
    const last = u.last;
    const email = `${(u.gamer_tag || u.first).toLowerCase().replace(/[^a-z0-9]/g, '')}@stage.local`;
    const id = uuidv4();
    const bio = u.pos ? `Preferred position: ${u.pos}` : null;

    try {
      await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, auth_provider, gamer_tag, bio)
         VALUES (?, ?, ?, ?, ?, 'local', ?, ?)`,
        [id, u.first, last, email, password_hash, u.gamer_tag, bio]
      );
      await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [id]);
      console.log(`Created: ${u.first} ${last} (@${u.gamer_tag}) - ${email}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`Skip (exists): ${email}`);
      } else {
        throw err;
      }
    }
  }

  await pool.end();
  console.log('\nDone. Default password for all: ' + DEFAULT_PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
