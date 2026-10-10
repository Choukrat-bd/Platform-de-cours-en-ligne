const PDFDocument = require('pdfkit');
const enrollmentModel = require('../models/enrollment.model');
const quizModel = require('../models/quiz.model');
const certificateModel = require('../models/certificate.model');

const MIN_PROGRESS = 100;
const MIN_AVERAGE = 60;

/**
 * Convertit une note (0-100) en mention académique.
 */
exports.gradeFromScore = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Tres Bien';
  if (score >= 70) return 'Bien';
  if (score >= 60) return 'Assez Bien';
  return 'Insuffisant';
};

/**
 * Vérifie si un étudiant remplit les conditions d'obtention du certificat :
 *  - 100 % des chapitres terminés
 *  - moyenne des quiz >= 60/100
 */
exports.checkEligibility = async (userId, courseId) => {
  const [enr] = await enrollmentModel.findEnrollment(userId, courseId);
  const [done] = await enrollmentModel.hasCompletedAllChapters(userId, courseId);
  const [avg] = await quizModel.averageForCourse(userId, courseId);

  const progress = done.total === 0 ? 0 : Math.round((done.done / done.total) * 100);
  const average = Number(avg.avg_grade || 0);

  const reasons = [];
  if (!enr) reasons.push("Vous n'êtes pas inscrit à ce cours.");
  if (progress < MIN_PROGRESS) reasons.push(`Progression insuffisante (${progress}% / ${MIN_PROGRESS}%).`);
  if (average < MIN_AVERAGE) reasons.push(`Moyenne des quiz insuffisante (${average}/100, minimum ${MIN_AVERAGE}).`);

  return {
    eligible: reasons.length === 0,
    enrolled: Boolean(enr),
    progress,
    average,
    reasons
  };
};

exports.buildCode = (userId, courseId) => {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CHA-${year}-${String(userId).padStart(4, '0')}-${String(courseId).padStart(3, '0')}-${rand}`;
};

/**
 * Émet un certificat s'il n'existe pas déjà. Retourne l'objet certificat.
 */
exports.issue = async (user, course, eligibility) => {
  const existing = await certificateModel.findByUserAndCourse(user.id, course.id);
  if (existing.length > 0) return existing[0];

  const grade = exports.gradeFromScore(eligibility.average);
  const code = exports.buildCode(user.id, course.id);
  const result = await certificateModel.create(user.id, course.id, code, grade);
  return certificateModel.findById(result.insertId).then((rows) => rows[0]);
};

/**
 * Génère le certificat au format PDF et l'écrit dans le flux fourni (res ou fichier).
 */
exports.generatePdf = (user, course, certificate, stream) => {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
  doc.pipe(stream);

  const W = doc.page.width;
  const H = doc.page.height;

  // Fond
  doc.rect(0, 0, W, H).fill('#fdf2f8');
  // Bordure décorative
  doc.rect(20, 20, W - 40, H - 40).lineWidth(4).strokeColor('#db2777').stroke();
  doc.rect(32, 32, W - 64, H - 64).lineWidth(1).strokeColor('#f9a8d4').stroke();
  // Bandeau supérieur
  doc.rect(32, 32, W - 64, 70).fill('#9d174d');

  doc.fillColor('#ffffff').fontSize(30).text('ChoukrApp Academie', 0, 52, { align: 'center', width: W });
  doc.fillColor('#fbcfe8').fontSize(11).text('Plateforme de cours en ligne - Université Privée Hay', 0, 84, { align: 'center', width: W });

  doc.fillColor('#9d174d').fontSize(26).text('CERTIFICAT DE RÉUSSITE', 0, 145, { align: 'center', width: W, characterSpacing: 2 });

  doc.fillColor('#334155').fontSize(13).text('Ce certificat est décerné à', 0, 200, { align: 'center', width: W });

  doc.fillColor('#0f172a').fontSize(32).text(`${user.prenom} ${user.nom}`, 0, 225, { align: 'center', width: W });

  doc.strokeColor('#db2777').lineWidth(1).moveTo(W / 2 - 180, 272).lineTo(W / 2 + 180, 272).stroke();

  doc.fillColor('#334155').fontSize(13).text('pour avoir complété avec succès le cours', 0, 292, { align: 'center', width: W });
  doc.fillColor('#be185d').fontSize(20).text(course.title, 0, 315, { align: 'center', width: W });

  const gradeLabel = certificate.grade === 'Tres Bien' ? 'Très Bien'
    : certificate.grade === 'Assez Bien' ? 'Assez Bien' : certificate.grade;
  doc.fillColor('#0f172a').fontSize(14).text(`Mention : ${gradeLabel}`, 0, 355, { align: 'center', width: W });

  doc.fillColor('#475569').fontSize(11)
    .text(`Code de vérification : ${certificate.code}`, 0, 390, { align: 'center', width: W })
    .text(`Délivré le ${new Date(certificate.issued_at || Date.now()).toLocaleDateString('fr-FR')}`, 0, 408, { align: 'center', width: W });

  doc.fillColor('#64748b').fontSize(10)
    .text('Le Directeur des Études', W - 260, H - 110, { width: 220, align: 'center' })
    .moveTo(W - 250, H - 90).lineTo(W - 50, H - 90).stroke()
    .text('UPH - Département Informatique', W - 260, H - 82, { width: 220, align: 'center' });

  doc.fillColor('#94a3b8').fontSize(9)
    .text('Document généré électroniquement par ChoukrApp Academie.', 40, H - 50, { width: 300 });

  doc.end();
};