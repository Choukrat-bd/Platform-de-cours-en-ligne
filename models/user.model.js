const { query } = require('../utils/db');

exports.create = (nom, prenom, email, passwordHash, role, bio) =>
  query(
    'INSERT INTO users (nom, prenom, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?, ?)',
    [nom, prenom, email, passwordHash, role, bio || null]
  );

exports.findByEmail = (email) => query('SELECT * FROM users WHERE email = ?', [email]);

exports.findById = (id) => query('SELECT id, nom, prenom, email, role, bio, created_at FROM users WHERE id = ?', [id]);

exports.updateProfile = (id, { nom, prenom, bio }) =>
  query('UPDATE users SET nom = ?, prenom = ?, bio = ? WHERE id = ?', [nom, prenom, bio, id]);

exports.countStudents = () =>
  query("SELECT COUNT(*) AS total FROM users WHERE role = 'etudiant'");

exports.allStudentsForAdmin = () =>
  query(
    "SELECT id, nom, prenom, email, role, bio, created_at FROM users ORDER BY created_at DESC"
  );