const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/', requireAuth, notificationController.list);
router.post('/read-all', requireAuth, notificationController.markAllRead);
router.post('/:id/read', requireAuth, notificationController.markRead);

module.exports = router;