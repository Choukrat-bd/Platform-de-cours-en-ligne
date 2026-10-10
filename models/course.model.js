const { query } = require('../utils/db');

const COLUMNS = 'id, enseignant_id, title, description, category, level, image, is_published, created_at';

exports.findAll = ({ search, category, level }) => {
  const conds = ['is_published = 1'];
  const params = [];
  if (search) {
    conds.push('(title LIKE ? OR description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (category) { conds.push('category = ?'); params.push(category); }
  if (level) { conds.push('level = ?'); params.push(level); }
  return query(
    `SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS enseignant
       FROM courses c
       JOIN users u ON u.id = c.enseignant_id
      WHERE ${conds.join(' AND ')}
      ORDER BY c.created_at DESC`,
    params
  );
};

exports.findById = (id) =>
  query(
    `SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS enseignant
       FROM courses c JOIN users u ON u.id = c.enseignant_id
      WHERE c.id = ?`, [id]
  );

exports.create = ({ enseignantId, title, description, category, level, isPublished }) =>
  query(
    'INSERT INTO courses (enseignant_id, title, description, category, level, is_published) VALUES (?, ?, ?, ?, ?, ?)',
    [enseignantId, title, description, category, level, isPublished === false ? 0 : 1]
  );

exports.update = (id, { title, description, category, level, isPublished }) =>
  query(
    'UPDATE courses SET title = ?, description = ?, category = ?, level = ?, is_published = ? WHERE id = ?',
    [title, description, category, level, isPublished ? 1 : 0, id]
  );

exports.remove = (id) => query('DELETE FROM courses WHERE id = ?', [id]);

exports.count = () => query('SELECT COUNT(*) AS total FROM courses');

exports.allCategories = () =>
  query('SELECT DISTINCT category FROM courses WHERE category IS NOT NULL AND category <> "" ORDER BY category');

exports.mineAsTeacher = (teacherId) =>
  query(
    `SELECT c.*, (SELECT COUNT(*) FROM chapters cp WHERE cp.course_id = c.id) AS chapitres
       FROM courses c WHERE c.enseignant_id = ? ORDER BY c.created_at DESC`, [teacherId]
  );