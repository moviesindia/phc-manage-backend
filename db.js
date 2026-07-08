const mysql = require('mysql2/promise');
require('dotenv').config();

console.log({
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD ? "exists" : "missing"
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then((conn) => {
    console.log('✅ Connected to TiDB Database successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });

module.exports = pool;