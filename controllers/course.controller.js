const courseModel = require('../models/course.model');
const chapterModel = require('../models/chapter.model');
const quizModel = require('../models/quiz.model');
const enrollmentModel = require('../models/enrollment.model');

function isOwnerOrAdmin(course, req) {
  return course.enseignant_id === req.session.userId || req.session.role === 'admin';
}

/** GET /api/courses  (catalogue public, avec filtres et recherche) */
exports.findAll = async (req, res) => {
  const { q, category, level } = req.query;
  const courses = await courseModel.findAll({ search: q, category, level });

  const enriched = [];
  for (const c of courses) {
    const [chaps] = await chapterModel.countByCourse(c.id);
    const quizzes = await quizModel.findByCourse(c.id);

    let enrolled = false;
    let progress = 0;
    if (req.session && req.session.userId) {
      const enr = await enrollmentModel.findEnrollment(req.session.userId, c.id);
      if (enr.length) { enrolled = true; progress = enr[0].progress; }
    }
    enriched.push({ ...c, chapitres: chaps.total, quiz_count: quizzes.length, enrolled, progress });
  }

  return res.json({ courses: enriched });
};

/** GET /api/courses/categories */
exports.categories = async (req, res) => {
  const rows = await courseModel.allCategories();
  return res.json({ categories: rows.map((r) => r.category) });
};

/** GET /api/courses/mine  (cours créés par l'enseignant connecté) */
exports.mine = async (req, res) => {
  const courses = await courseModel.mineAsTeacher(req.session.userId);
  return res.json({ courses });
};

/** GET /api/courses/:id */
exports.detail = async (req, res) => {
  const courseId = Number(req.params.id);
  const rows = await courseModel.findById(courseId);
  if (rows.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  const course = rows[0];

  const chapters = await chapterModel.findByCourse(courseId);
  const quizzes = await quizModel.findByCourse(courseId);

  let enrolled = false;
  let progress = 0;
  let chapterState = [];
  if (req.session && req.session.userId) {
    const enr = await enrollmentModel.findEnrollment(req.session.userId, courseId);
    if (enr.length) {
      enrolled = true;
      progress = enr[0].progress;
      chapterState = (await enrollmentModel.courseState(req.session.userId, courseId))
        .map((s) => ({ chapter_id: s.chapter_id, completed: !!s.completed, last_position: s.last_position }));
    }
  }

  return res.json({ course, chapters, quizzes, enrolled, progress, chapter_state: chapterState });
};

/** POST /api/courses  (enseignant / admin) */
exports.create = async (req, res) => {
  const { title, description, category, level, is_published } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Le titre du cours est obligatoire.' });

  const result = await courseModel.create({
    enseignantId: req.session.userId,
    title,
    description: description || '',
    category: category || 'Général',
    level: ['Debutant', 'Intermediaire', 'Avance'].includes(level) ? level : 'Debutant',
    isPublished: is_published !== false
  });
  const [course] = await courseModel.findById(result.insertId);
  return res.status(201).json({ message: 'Cours créé avec succès.', course });
};

/** PUT /api/courses/:id  (propriétaire ou admin) */
exports.update = async (req, res) => {
  const courseId = Number(req.params.id);
  const rows = await courseModel.findById(courseId);
  if (rows.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  if (!isOwnerOrAdmin(rows[0], req)) {
    return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres cours.' });
  }

  const { title, description, category, level, is_published } = req.body || {};
  await courseModel.update(courseId, {
    title: title || rows[0].title,
    description: description ?? rows[0].description,
    category: category || rows[0].category,
    level: level || rows[0].level,
    isPublished: is_published === undefined ? !!rows[0].is_published : is_published
  });
  const [course] = await courseModel.findById(courseId);
  return res.json({ message: 'Cours mis à jour.', course });
};

/** DELETE /api/courses/:id */
exports.remove = async (req, res) => {
  const courseId = Number(req.params.id);
  const rows = await courseModel.findById(courseId);
  if (rows.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  if (!isOwnerOrAdmin(rows[0], req)) {
    return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres cours.' });
  }
  await courseModel.remove(courseId);
  return res.json({ message: 'Cours supprimé.' });
};