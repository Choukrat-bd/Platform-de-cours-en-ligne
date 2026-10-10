const router = require('express').Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Inscription & progression
router.post('/courses/:id/enroll', requireAuth, enrollmentController.enroll);
router.post('/chapters/:id/complete', requireAuth, enrollmentController.completeChapter);
router.put('/chapters/:id/position', requireAuth, enrollmentController.savePosition);

// Espace personnel
router.get('/me/courses', requireAuth, enrollmentController.myCourses);
router.get('/me/dashboard', requireAuth, enrollmentController.dashboard);

module.exports = router;