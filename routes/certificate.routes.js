const router = require('express').Router();
const certificateController = require('../controllers/certificate.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/me/certificates', requireAuth, certificateController.mine);
router.get('/me/certificates/eligible', requireAuth, certificateController.eligible);
router.post('/courses/:id/certificate', requireAuth, certificateController.generate);
router.get('/certificates/:id/download', requireAuth, certificateController.download);
router.get('/certificates/verify/:code', certificateController.verify); // public

module.exports = router;