const pool = require('../config/db');
const { query, parseInt } = require('../utils/db');

exports.enroll = (userId, courseId) =>
  query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);

exports.findEnrollment = (userId, courseId) =>
  query('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);

exports.myCourses = (userId) =>
  query(
    `SELECT e.id AS enrollment_id, e.progress, e.completed_at, e.created_at,
            c.id AS course_id, c.title, c.category, c.level, c.description,
            (SELECT COUNT(*) FROM chapters ch WHERE ch.course_id = c.id) AS total_chapitres,
            (SELECT COUNT(*) FROM chapters ch
              JOIN chapter_progress cp ON cp.chapter_id = ch.id
             WHERE ch.course_id = c.id AND cp.user_id = ? AND cp.completed = 1) AS chapitres_termines
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC`,
    [userId, userId]
  );

/**
 * Met à jour la progression globale d'un cours en pourcentage.
 * = chapitres terminés (table chapter_progress) / total de chapitres * 100.
 * Met aussi à jour completed_at lorsque 100% est atteint.
 */
exports.refreshProgress = async (userId, courseId) => {
  const [[stats]] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM chapters WHERE course_id = ?) AS total,
        (SELECT COUNT(*) FROM chapters ch
           JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = ? AND cp.completed = 1
          WHERE ch.course_id = ?) AS done`,
    [courseId, userId, courseId]
  );
  const total = parseInt(stats.total, 0);
  const done = parseInt(stats.done, 0);
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const completedAt = progress >= 100 ? 'NOW()' : 'NULL';
  await pool.query(
    `UPDATE enrollments SET progress = ?, completed_at = ${completedAt} WHERE user_id = ? AND course_id = ?`,
    [progress, userId, courseId]
  );
  return progress;
};

// ---- Suivi par chapitre ----
exports.setChapterCompleted = (userId, chapterId, completed) =>
  query(
    `INSERT INTO chapter_progress (user_id, chapter_id, completed)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE completed = VALUES(completed)`,
    [userId, chapterId, completed ? 1 : 0]
  );

exports.savePosition = (userId, chapterId, lastPosition) =>
  query(
    `INSERT INTO chapter_progress (user_id, chapter_id, last_position)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE last_position = VALUES(last_position)`,
    [userId, chapterId, lastPosition]
  );

exports.chapterState = (userId, chapterId) =>
  query('SELECT * FROM chapter_progress WHERE user_id = ? AND chapter_id = ?', [userId, chapterId]);

exports.courseState = (userId, courseId) =>
  query(
    `SELECT ch.id AS chapter_id, ch.position, ch.title,
            COALESCE(cp.completed, 0) AS completed, COALESCE(cp.last_position, 0) AS last_position
       FROM chapters ch
       LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = ?
      WHERE ch.course_id = ?
      ORDER BY ch.position, ch.id`,
    [userId, courseId]
  );

exports.hasCompletedAllChapters = (userId, courseId) =>
  query(
    `SELECT COUNT(*) AS done,
            (SELECT COUNT(*) FROM chapters WHERE course_id = ?) AS total
       FROM chapters ch
       JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = ? AND cp.completed = 1
      WHERE ch.course_id = ?`,
    [courseId, userId, courseId]
  );

exports.countEnrollments = () => query('SELECT COUNT(*) AS total FROM enrollments');