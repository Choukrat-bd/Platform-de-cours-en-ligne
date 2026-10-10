const router = require('express').Router();
const courseController = require('../controllers/course.controller');
const quizController = require('../controllers/quiz.controller');
const chapterController = require('../controllers/chapter.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// --- Lecture (catalogue + détail) ---
router.get('/', courseController.findAll);
router.get('/categories', courseController.categories);
router.get('/mine', requireAuth, requireRole('enseignant', 'admin'), courseController.mine);
router.get('/:id', courseController.detail);
router.get('/:id/quizzes', quizController.byCourse);

// --- Gestion des cours (enseignant / admin) ---
router.post('/', requireAuth, requireRole('enseignant', 'admin'), courseController.create);
router.put('/:id', requireAuth, requireRole('enseignant', 'admin'), courseController.update);
router.delete('/:id', requireAuth, requireRole('enseignant', 'admin'), courseController.remove);

// --- Chapitres rattachés à un cours ---
router.post('/:courseId/chapters', requireAuth, requireRole('enseignant', 'admin'), chapterController.create);

// --- Quiz rattachés à un cours ---
router.post('/:id/quizzes', requireAuth, requireRole('enseignant', 'admin'), quizController.createQuiz);

module.exports = router;