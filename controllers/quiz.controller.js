const quizModel = require('../models/quiz.model');
const courseModel = require('../models/course.model');
const certificateModel = require('../models/certificate.model');
const certificateService = require('../services/certificate.service');
const notificationService = require('../services/notification.service');
const userModel = require('../models/user.model');
const { parseJson } = require('../utils/db');

/** GET /api/courses/:id/quizzes */
exports.byCourse = async (req, res) => {
  const quizzes = await quizModel.findByCourse(Number(req.params.id));
  return res.json({ quizzes });
};

/**
 * GET /api/quizzes/:id
 * Renvoie le quiz avec ses questions SANS les bonnes réponses
 * (la correction est faite côté serveur pour éviter la triche).
 */
exports.detail = async (req, res) => {
  const quizId = Number(req.params.id);
  const quizzes = await quizModel.findById(quizId);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz introuvable.' });
  const quiz = quizzes[0];

  const questions = (await quizModel.findQuestions(quizId)).map((q) => ({
    id: q.id,
    text: q.text,
    options: parseJson(q.options),
    points: q.points
  }));

  const attempts = await quizModel.studentAttempts(req.session.userId, quizId);
  const [best] = await quizModel.bestScore(req.session.userId, quizId);

  return res.json({ quiz, questions, attempts, best: best.best });
};

/**
 * POST /api/quizzes/:id/submit
 * Corps attendu : { answers: [index, index, ...] }
 * -> correction automatique + enregistrement de la note + notifications
 */
exports.submit = async (req, res) => {
  const quizId = Number(req.params.id);
  const quizzes = await quizModel.findById(quizId);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz introuvable.' });
  const quiz = quizzes[0];

  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const result = await quizModel.correctAndSave(req.session.userId, quizId, answers);

  await notificationService.notify(
    req.session.userId,
    `Quiz « ${quiz.title} » corrigé : ${result.score}/100.`,
    result.score >= 60 ? 'success' : 'warning'
  );

  // Tentative d'obtention automatique du certificat (si conditions remplies)
  const courses = await courseModel.findById(quiz.course_id);
  let certificate = null;
  if (courses.length > 0) {
    const course = courses[0];
    const eligibility = await certificateService.checkEligibility(req.session.userId, course.id);
    if (eligibility.eligible) {
      const existing = await certificateModel.findByUserAndCourse(req.session.userId, course.id);
      if (existing.length === 0) {
        const [user] = await userModel.findById(req.session.userId);
        certificate = await certificateService.issue(user, course, eligibility);
        await notificationService.certificateIssued(req.session.userId, course.title, certificate.code);
      } else {
        certificate = existing[0];
      }
    }
  }

  return res.json({ message: 'Quiz corrigé.', ...result, certificate });
};

/** POST /api/courses/:id/quizzes  (enseignant) */
exports.createQuiz = async (req, res) => {
  const courseId = Number(req.params.id);
  const courses = await courseModel.findById(courseId);
  if (courses.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  if (courses[0].enseignant_id !== req.session.userId && req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Action réservée au propriétaire du cours.' });
  }
  const { title, questions } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Le titre du quiz est obligatoire.' });

  const result = await quizModel.create(courseId, title);
  const quizId = result.insertId;

  if (Array.isArray(questions) && questions.length > 0) {
    for (const q of questions) {
      if (!q.text || !Array.isArray(q.options) || q.correctIndex === undefined) continue;
      await quizModel.addQuestion(quizId, {
        text: q.text,
        options: q.options,
        correctIndex: Number(q.correctIndex),
        explanation: q.explanation,
        points: q.points
      });
    }
  }
  const [quiz] = await quizModel.findById(quizId);
  return res.status(201).json({ message: 'Quiz créé.', quiz });
};

/** POST /api/quizzes/:id/questions  (enseignant) */
exports.addQuestion = async (req, res) => {
  const quizId = Number(req.params.id);
  const quizzes = await quizModel.findById(quizId);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz introuvable.' });
  const courses = await courseModel.findById(quizzes[0].course_id);
  if (courses.length === 0 || (courses[0].enseignant_id !== req.session.userId && req.session.role !== 'admin')) {
    return res.status(403).json({ message: 'Action réservée au propriétaire du cours.' });
  }

  const { text, options, correctIndex, explanation, points } = req.body || {};
  if (!text || !Array.isArray(options) || options.length < 2 || correctIndex === undefined) {
    return res.status(400).json({ message: 'Question invalide (texte, au moins 2 options et l\'index de la bonne réponse requis).' });
  }

  const result = await quizModel.addQuestion(quizId, {
    text,
    options,
    correctIndex: Number(correctIndex),
    explanation,
    points
  });
  return res.status(201).json({ message: 'Question ajoutée.', question_id: result.insertId });
};

/** DELETE /api/quizzes/:id (enseignant) */
exports.remove = async (req, res) => {
  const quizId = Number(req.params.id);
  const quizzes = await quizModel.findById(quizId);
  if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz introuvable.' });
  const courses = await courseModel.findById(quizzes[0].course_id);
  if (courses.length === 0 || (courses[0].enseignant_id !== req.session.userId && req.session.role !== 'admin')) {
    return res.status(403).json({ message: 'Action réservée au propriétaire du cours.' });
  }
  await quizModel.remove(quizId);
  return res.json({ message: 'Quiz supprimé.' });
};