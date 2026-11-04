// ============================================================================
// File: db.js
// Description: MySQL connection pool (mysql2) for Meow Meow Tarot.
// The schema, stored procedure, function and triggers live in MySQL itself
// (see sql/schema.sql and sql/reset_demo.sql). This file only connects to it.
// All credentials are read from .env (never hardcoded).
// ============================================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Step 1: Create a connection pool using values from .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'meow_meow_tarot',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // return DATE / DATETIME as 'YYYY-MM-DD ...' strings
});

/**
 * Run a parameterized query and return the rows (or the result header for
 * INSERT / UPDATE / DELETE, which has insertId and affectedRows).
 * pool.execute() sends the SQL and the values separately (prepared statement),
 * so user input can never change the SQL itself.
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Same as query() but returns only the first row (or null). */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Call the MySQL stored procedure sp_calculate_life_path(IN b_date, OUT lpn).
 * The OUT value is stored in the session variable @lpn, so both statements
 * must run on the same connection.
 */
async function callLifePathProcedure(birthDate) {
  const conn = await pool.getConnection();
  try {
    await conn.query('CALL sp_calculate_life_path(?, @lpn)', [birthDate]);
    const [rows] = await conn.query('SELECT @lpn AS lpn');
    return Number(rows[0].lpn);
  } finally {
    conn.release();
  }
}

/**
 * Startup check: make sure MySQL is reachable and the schema exists,
 * then make sure one demo account per role exists (values from .env).
 */
async function initDatabase() {
  try {
    await queryOne('SELECT COUNT(*) AS cnt FROM TAROT_CARDS');
  } catch (err) {
    const hints = {
      ECONNREFUSED: 'MySQL server is not running. Start the MySQL80 service, then try again.',
      ER_ACCESS_DENIED_ERROR: 'Wrong DB_USER or DB_PASSWORD in .env.',
      ER_BAD_DB_ERROR: 'Database not found. Run sql/reset_demo.sql in MySQL Workbench first.',
      ER_NO_SUCH_TABLE: 'Tables not found. Run sql/reset_demo.sql in MySQL Workbench first.'
    };
    console.error('❌ Could not connect to MySQL:', hints[err.code] || err.message);
    throw err;
  }

  // Demo accounts for the three roles. Passwords come from .env and are
  // stored as bcrypt hashes. Existing rows (e.g. from reset_demo.sql) get
  // their password and role refreshed so the .env values always work.
  const accounts = [
    ['Admin Meow', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, '1999-04-10', 'admin'],
    ['Developer Meow', process.env.DEV_EMAIL, process.env.DEV_PASSWORD, '2000-08-15', 'developer'],
    ['testja', process.env.USER_EMAIL, process.env.USER_PASSWORD, '2003-01-05', 'user']
  ];

  for (const [name, email, password, birthDate, role] of accounts) {
    if (!email || !password) continue; // not configured in .env
    const hash = await bcrypt.hash(password, 10);
    const existing = await queryOne('SELECT user_id FROM USERS WHERE email = ?', [email]);
    if (existing) {
      await query('UPDATE USERS SET password = ?, role = ? WHERE user_id = ?', [hash, role, existing.user_id]);
    } else {
      // Trigger trg_assign_zodiac_before_insert fills zodiac_id from birth_date
      await query(
        'INSERT INTO USERS (name, email, password, birth_date, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hash, birthDate, role]
      );
    }
  }

  console.log('🗄️  Connected to MySQL database:', process.env.DB_NAME || 'meow_meow_tarot');
}

module.exports = {
  pool,
  query,
  queryOne,
  callLifePathProcedure,
  initDatabase
};
