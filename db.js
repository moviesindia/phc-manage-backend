const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool using the .env variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then((conn) => {
    console.log('✅ Connected to MySQL Database successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error connecting to the database:', err.message);
  });

module.exports = pool;