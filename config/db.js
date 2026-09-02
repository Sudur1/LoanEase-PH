const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'loanease_ph';

// Pool WITHOUT a default database (used to create the database first if it doesn't exist)
const adminPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Main connection pool with the loanease_ph database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Wait for MySQL to be ready (Kubernetes/Docker may start mysql later than app)
async function waitForDatabase(maxRetries = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await adminPool.getConnection();
      console.log('✅ MySQL server is reachable');
      connection.release();
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for MySQL... attempt ${attempt}/${maxRetries} (${error.code || error.message})`);
      if (attempt === maxRetries) {
        console.error('❌ MySQL connection failed after all retries');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Ensure the database exists (creates it if missing)
async function ensureDatabaseExists() {
  const connection = await adminPool.getConnection();
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database "${DB_NAME}" is ready`);
  } finally {
    connection.release();
  }
}

module.exports = pool;
module.exports.adminPool = adminPool;
module.exports.waitForDatabase = waitForDatabase;
module.exports.ensureDatabaseExists = ensureDatabaseExists;
module.exports.DB_NAME = DB_NAME;
