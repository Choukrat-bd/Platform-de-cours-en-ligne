const mysql = require('mysql2/promise');
const fs = require('fs');
const config = require('./config');

// S'assure que les dossiers d'uploads existent
fs.mkdirSync(config.paths.uploads, { recursive: true });
fs.mkdirSync(config.paths.uploadsPdf, { recursive: true });
fs.mkdirSync(config.paths.uploadsVideo, { recursive: true });
fs.mkdirSync(config.paths.uploadsCert, { recursive: true });

const pool = mysql.createPool({
  ...config.db,
  ...(config.dbSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4'
});

module.exports = pool;