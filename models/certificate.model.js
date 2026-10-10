const { query } = require('../utils/db');

exports.findByUser = (userId) =>
  query(
    `SELECT cert.id, cert.code, cert.grade, cert.issued_at,
            c.id AS course_id, c.title AS course_title, c.category
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
      WHERE cert.user_id = ?
      ORDER BY cert.issued_at DESC`,
    [userId]
  );

exports.findByUserAndCourse = (userId, courseId) =>
  query('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId]);

exports.findById = (id) => query('SELECT * FROM certificates WHERE id = ?', [id]);

exports.findByCode = (code) => query('SELECT * FROM certificates WHERE code = ?', [code]);

exports.create = (userId, courseId, code, grade) =>
  query('INSERT INTO certificates (user_id, course_id, code, grade) VALUES (?, ?, ?, ?)', [userId, courseId, code, grade]);

exports.count = () => query('SELECT COUNT(*) AS total FROM certificates');