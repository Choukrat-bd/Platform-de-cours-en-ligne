const chapterModel = require('../models/chapter.model');
const courseModel = require('../models/course.model');

async function canManageChapter(chapterId, req) {
  const chapters = await chapterModel.findById(chapterId);
  if (chapters.length === 0) return { ok: false, status: 404, message: 'Chapitre introuvable.' };
  const courses = await courseModel.findById(chapters[0].course_id);
  if (courses.length === 0) return { ok: false, status: 404, message: 'Cours introuvable.' };
  const course = courses[0];
  if (course.enseignant_id !== req.session.userId && req.session.role !== 'admin') {
    return { ok: false, status: 403, message: 'Action réservée au propriétaire du cours.' };
  }
  return { ok: true, chapter: chapters[0], course };
}

/** POST /api/courses/:courseId/chapters  (enseignant) */
exports.create = async (req, res) => {
  const courseId = Number(req.params.courseId);
  const courses = await courseModel.findById(courseId);
  if (courses.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  if (courses[0].enseignant_id !== req.session.userId && req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Vous ne pouvez agir que sur vos propres cours.' });
  }

  const { title, content, position, video_url, pdf_url } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Le titre du chapitre est obligatoire.' });

  const [max] = await chapterModel.maxPosition(courseId);
  const result = await chapterModel.create(courseId, {
    title,
    content: content || '',
    position: position ? Number(position) : Number(max.maxPos) + 1,
    videoUrl: video_url || null,
    pdfUrl: pdf_url || null
  });
  const [chapter] = await chapterModel.findById(result.insertId);
  return res.status(201).json({ message: 'Chapitre ajouté.', chapter });
};

/** PUT /api/chapters/:id */
exports.update = async (req, res) => {
  const check = await canManageChapter(Number(req.params.id), req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const { title, content, position, video_url, pdf_url } = req.body || {};
  await chapterModel.update(check.chapter.id, {
    title: title || check.chapter.title,
    content: content ?? check.chapter.content,
    position: position !== undefined ? Number(position) : check.chapter.position,
    videoUrl: video_url || null,
    pdfUrl: pdf_url || null
  });
  const [chapter] = await chapterModel.findById(check.chapter.id);
  return res.json({ message: 'Chapitre mis à jour.', chapter });
};

/** DELETE /api/chapters/:id */
exports.remove = async (req, res) => {
  const check = await canManageChapter(Number(req.params.id), req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });
  await chapterModel.remove(check.chapter.id);
  return res.json({ message: 'Chapitre supprimé.' });
};

/** POST /api/chapters/:id/upload  (multipart : champs "pdf" et "video") */
exports.upload = async (req, res) => {
  const check = await canManageChapter(Number(req.params.id), req);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  const base = '/uploads';
  const media = {};
  if (req.files && req.files.pdf && req.files.pdf[0]) {
    media.pdfUrl = `${base}/pdfs/${req.files.pdf[0].filename}`;
  }
  if (req.files && req.files.video && req.files.video[0]) {
    media.videoUrl = `${base}/videos/${req.files.video[0].filename}`;
  }
  if (Object.keys(media).length === 0) {
    return res.status(400).json({ message: 'Aucun fichier reçu (champs attendus : pdf, video).' });
  }

  await chapterModel.updateMedia(check.chapter.id, media);
  const [chapter] = await chapterModel.findById(check.chapter.id);
  return res.json({ message: 'Média(s) téléversé(s).', chapter });
};