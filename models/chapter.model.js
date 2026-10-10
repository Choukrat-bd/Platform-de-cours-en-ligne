const { query } = require('../utils/db');

exports.findByCourse = (courseId) =>
  query('SELECT * FROM chapters WHERE course_id = ? ORDER BY position, id', [courseId]);

exports.findById = (id) => query('SELECT * FROM chapters WHERE id = ?', [id]);

exports.create = (courseId, { title, content, position, videoUrl, pdfUrl }) =>
  query(
    'INSERT INTO chapters (course_id, title, content, position, video_url, pdf_url) VALUES (?, ?, ?, ?, ?, ?)',
    [courseId, title, content, position, videoUrl || null, pdfUrl || null]
  );

exports.update = (id, { title, content, position, videoUrl, pdfUrl }) =>
  query(
    'UPDATE chapters SET title = ?, content = ?, position = ?, video_url = COALESCE(?, video_url), pdf_url = COALESCE(?, pdf_url) WHERE id = ?',
    [title, content, position, videoUrl || null, pdfUrl || null, id]
  );

exports.updateMedia = (id, { videoUrl, pdfUrl }) => {
  const sets = [];
  const params = [];
  if (videoUrl !== undefined) { sets.push('video_url = ?'); params.push(videoUrl); }
  if (pdfUrl !== undefined) { sets.push('pdf_url = ?'); params.push(pdfUrl); }
  if (sets.length === 0) return Promise.resolve();
  params.push(id);
  return query(`UPDATE chapters SET ${sets.join(', ')} WHERE id = ?`, params);
};

exports.remove = (id) => query('DELETE FROM chapters WHERE id = ?', [id]);

exports.countByCourse = (courseId) =>
  query('SELECT COUNT(*) AS total FROM chapters WHERE course_id = ?', [courseId]);

exports.maxPosition = (courseId) =>
  query('SELECT COALESCE(MAX(position), 0) AS maxPos FROM chapters WHERE course_id = ?', [courseId]);