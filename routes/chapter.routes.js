const router = require('express').Router();
const chapterController = require('../controllers/chapter.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { uploadFields } = require('../middlewares/upload.middleware');

router.put('/:id', requireAuth, requireRole('enseignant', 'admin'), chapterController.update);
router.delete('/:id', requireAuth, requireRole('enseignant', 'admin'), chapterController.remove);
router.post('/:id/upload', requireAuth, requireRole('enseignant', 'admin'), uploadFields, chapterController.upload);

module.exports = router;