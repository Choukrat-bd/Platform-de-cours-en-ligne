const path = require('path');
require('dotenv').config();

function parseDbUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname || !u.username) return null;
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password || ''),
      database: u.pathname.replace(/^\//, '')
    };
  } catch {
    return null;
  }
}

const dbFromUrl = parseDbUrl(process.env.DATABASE_URL);

module.exports = {
  port: process.env.SERVER_PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,
  sessionSecret: process.env.SESSION_SECRET || 'choukrapp_secret_2026',
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  db: dbFromUrl || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'choukrapp_db'
  },
  dbSsl: String(process.env.MYSQL_SSL || '').toLowerCase() === 'true',
  paths: {
    root: path.join(__dirname, '..'),
    uploads: path.join(__dirname, '..', 'uploads'),
    uploadsPdf: path.join(__dirname, '..', 'uploads', 'pdfs'),
    uploadsVideo: path.join(__dirname, '..', 'uploads', 'videos'),
    uploadsCert: path.join(__dirname, '..', 'uploads', 'certificates'),
    public: path.join(__dirname, '..', 'public')
  },
  // Condition de réussite pour le certificat
  certificate: {
    minProgress: 100,     // % de chapitres terminés requis
    minQuizGrade: 60      // moyenne minimale /100 sur les quiz du cours
  }
};