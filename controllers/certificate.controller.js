const certificateModel = require('../models/certificate.model');
const courseModel = require('../models/course.model');
const userModel = require('../models/user.model');
const enrollmentModel = require('../models/enrollment.model');
const certificateService = require('../services/certificate.service');
const notificationService = require('../services/notification.service');

/** GET /api/me/certificates */
exports.mine = async (req, res) => {
  const certificates = await certificateModel.findByUser(req.session.userId);
  return res.json({ certificates });
};

/** GET /api/me/certificates/eligible  (état des cours pour la délivrance) */
exports.eligible = async (req, res) => {
  const userId = req.session.userId;
  const courses = await enrollmentModel.myCourses(userId);
  const mine = await certificateModel.findByUser(userId);
  const byCourse = new Map(mine.map((c) => [c.course_id, c]));

  const list = [];
  for (const c of courses) {
    const eligibility = await certificateService.checkEligibility(userId, c.course_id);
    list.push({
      course_id: c.course_id,
      title: c.title,
      category: c.category,
      progress: eligibility.progress,
      average: eligibility.average,
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      certificate: byCourse.get(c.course_id) || null
    });
  }
  return res.json({ courses: list });
};

/** POST /api/courses/:id/certificate  (génération à la demande) */
exports.generate = async (req, res) => {
  const courseId = Number(req.params.id);
  const courses = await courseModel.findById(courseId);
  if (courses.length === 0) return res.status(404).json({ message: 'Cours introuvable.' });
  const course = courses[0];

  const eligibility = await certificateService.checkEligibility(req.session.userId, courseId);
  if (!eligibility.eligible) {
    return res.status(403).json({
      message: 'Certificat non disponible : conditions non remplies.',
      details: eligibility
    });
  }

  const existing = await certificateModel.findByUserAndCourse(req.session.userId, courseId);
  let certificate = existing[0];
  if (!certificate) {
    const [user] = await userModel.findById(req.session.userId);
    certificate = await certificateService.issue(user, course, eligibility);
    await notificationService.certificateIssued(req.session.userId, course.title, certificate.code);
  }

  return res.status(201).json({ message: 'Certificat généré.', certificate });
};

/**
 * GET /api/certificates/:id/download
 * Génère le PDF à la volée et le transmet en téléchargement.
 */
exports.download = async (req, res) => {
  const certId = Number(req.params.id);
  const rows = await certificateModel.findById(certId);
  if (rows.length === 0) return res.status(404).json({ message: 'Certificat introuvable.' });
  const certificate = rows[0];

  // Un étudiant ne peut télécharger que ses propres certificats ; admin peut tout.
  if (certificate.user_id !== req.session.userId && req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé à ce certificat.' });
  }

  const [user] = await userModel.findById(certificate.user_id);
  const [course] = await courseModel.findById(certificate.course_id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificat-${certificate.code}.pdf"`);

  certificateService.generatePdf(user, course, certificate, res);
};

/** GET /api/certificates/verify/:code  (vérification publique d'authenticité) */
exports.verify = async (req, res) => {
  const rows = await certificateModel.findByCode(req.params.code);
  if (rows.length === 0) return res.status(404).json({ valid: false, message: 'Code de certificat inconnu.' });

  const certificate = rows[0];
  const [user] = await userModel.findById(certificate.user_id);
  const [course] = await courseModel.findById(certificate.course_id);

  return res.json({
    valid: true,
    certificate: {
      code: certificate.code,
      grade: certificate.grade,
      issued_at: certificate.issued_at,
      student: `${user.prenom} ${user.nom}`,
      course: course.title
    }
  });
};