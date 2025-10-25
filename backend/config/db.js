const mysql = require('mysql2/promise');
require('dotenv').config();

/*
 * Database Connection Pool
 * 
 * This module creates and exports a MySQL connection pool for the application. It uses the
 * mysql2 library to provide promise-based connections. The pool is configured using environment
 * variables and includes a startup test to verify connectivity.
 * 
 * Exports:
 * - pool: A promise-based MySQL connection pool.
 * 
 * Notes:
 * - Ensure the .env file contains the necessary DB_* variables.
 * - The startup test logs a success or error message based on the connection status.
 */

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'CollegeCRElection',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
})();

module.exports = pool;
