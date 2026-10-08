const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'acxiomcrm',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: '+00:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on boot
pool.getConnection()
  .then((conn) => {
    console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME}"`);
    conn.release();
  })
  .catch((err) => {
    console.error('[Database] Connection failed:', err.message);
  });

module.exports = pool;
