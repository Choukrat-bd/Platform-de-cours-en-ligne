const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/courses', require('./course.routes'));
router.use('/chapters', require('./chapter.routes'));
router.use('/quizzes', require('./quiz.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/', require('./enrollment.routes'));
router.use('/', require('./certificate.routes'));
router.use('/', require('./user.routes'));

module.exports = router;