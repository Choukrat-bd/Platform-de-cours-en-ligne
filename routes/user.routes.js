const router = require('express').Router();
const userController = require('../controllers/user.controller');
const statsController = require('../controllers/stats.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.get('/users/me', requireAuth, userController.me);
router.put('/users/me', requireAuth, userController.updateMe);

router.get('/stats', requireAuth, requireRole('enseignant', 'admin'), statsController.global);

module.exports = router;