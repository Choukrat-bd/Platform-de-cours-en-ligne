const router = require('express').Router();
const quizController = require('../controllers/quiz.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/:id', requireAuth, quizController.detail);
router.post('/:id/submit', requireAuth, quizController.submit);
router.post('/:id/questions', requireAuth, requireRole('enseignant', 'admin'), quizController.addQuestion);
router.delete('/:id', requireAuth, requireRole('enseignant', 'admin'), quizController.remove);

module.exports = router;