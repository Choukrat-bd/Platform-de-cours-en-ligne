const enrollmentModel = require('../models/enrollment.model');
const chapterModel = require('../models/chapter.model');
const courseModel = require('../models/course.model');
const quizModel = require('../models/quiz.model');
const certificateModel = require('../models/certificate.model');
const certificateService = require('../services/certificate.service');
const notificationService = require('../services/notification.service');
const userModel = require('../models/user.model');

/**
 * Tente de délivrer automatiquement le certificat si l'étudiant est éligible.
 * (100 % des chapitres terminés + moyenne des quiz >= 60)
 * Retourne le certificat créé/existant ou null.
 */
async function autoIssueCertificate(userId, course) {
  const userRows = await userModel.findById(userId);
  if (userRows.length === 0) return null;
  const user = userRows[0];

  const eligibility = await certificateService.checkEligibility(userId, course.id);
  if (!eligibility.eligible) return null;

  const existing = await certificateModel.findByUserAndCourse(userId, course.id);
  if (existing.length > 0) return existing[0];

  const cert = await certificateService.issue(user, course, eligibility);
  await notificationService.certificateIssued(userId, course.title, cert.code);
  return cert;
}

/** POST /api/courses/:id/enroll */
exports.enroll = async (req, res) => {
  const courseId = Number(req.params.id);
  const courses = await courseModel.findById(courseId);
  if (courses.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });

  const existing = await enrollmentModel.findEnrollment(req.session.userId, courseId);
  if (existing.length > 0) {
    return res.status(200).json({ message: 'Vous êtes déjà inscrit à ce cours.', already: true });
  }

  await enrollmentModel.enroll(req.session.userId, courseId);
  await notificationService.notify(
    req.session.userId,
    `Inscription confirmée au cours « ${courses[0].title} ». Bon apprentissage !`,
    'success'
  );
  return res.status(201).json({ message: 'Inscription réussie.' });
};

/** GET /api/me/courses */
exports.myCourses = async (req, res) => {
  const courses = await enrollmentModel.myCourses(req.session.userId);
  return res.json({ courses });
};

/** POST /api/chapters/:id/complete  { completed: boolean } */
exports.completeChapter = async (req, res) => {
  const chapterId = Number(req.params.id);
  const chapters = await chapterModel.findById(chapterId);
  if (chapters.length === 0) return res.status(404).json({ message: 'Chapitre introuvable.' });
  const chapter = chapters[0];

  const existing = await enrollmentModel.findEnrollment(req.session.userId, chapter.course_id);
  if (existing.length === 0) {
    return res.status(403).json({ message: 'Vous devez être inscrit à ce cours pour suivre votre progression.' });
  }

  const completed = req.body.completed !== false;
  await enrollmentModel.setChapterCompleted(req.session.userId, chapterId, completed);
  const progress = await enrollmentModel.refreshProgress(req.session.userId, chapter.course_id);

  let certificate = null;
  if (completed) {
    await notificationService.notify(req.session.userId, `Chapitre terminé : « ${chapter.title} ».`, 'success');
    if (progress >= 100) {
      const [course] = await courseModel.findById(chapter.course_id);
      await notificationService.notify(req.session.userId, `Bravo, vous avez terminé le cours « ${course.title} » !`, 'success');
      certificate = await autoIssueCertificate(req.session.userId, course);
    }
  }

  return res.json({ message: 'Progression mise à jour.', progress, certificate });
};

/** PUT /api/chapters/:id/position  { last_position } */
exports.savePosition = async (req, res) => {
  const chapterId = Number(req.params.id);
  const chapters = await chapterModel.findById(chapterId);
  if (chapters.length === 0) return res.status(404).json({ message: 'Chapitre introuvable.' });
  const pos = Number(req.body.last_position || 0);
  await enrollmentModel.savePosition(req.session.userId, chapterId, pos);
  return res.json({ message: 'Position enregistrée.' });
};

/** GET /api/me/dashboard */
exports.dashboard = async (req, res) => {
  const userId = req.session.userId;

  const courses = await enrollmentModel.myCourses(userId);
  const attempts = await quizModel.allAttemptsForUser(userId);
  const certificates = await certificateModel.findByUser(userId);

  const enrolled = courses.length;
  const completed = courses.filter((c) => Number(c.progress) >= 100).length;
  const avgProgress = enrolled === 0
    ? 0
    : Math.round(courses.reduce((sum, c) => sum + Number(c.progress), 0) / enrolled);
  const avgGrade = attempts.length === 0
    ? 0
    : Math.round(attempts.reduce((sum, a) => sum + Number(a.note), 0) / attempts.length);

  return res.json({
    stats: {
      enrolled,
      completed,
      in_progress: enrolled - completed,
      avg_progress: avgProgress,
      avg_grade: avgGrade,
      attempts: attempts.length,
      certificates: certificates.length
    },
    courses,
    attempts,
    certificates
  });
};