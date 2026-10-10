const notificationModel = require('../models/notification.model');

/**
 * Petit service de notifications : centralise la création
 * pour garantir un message/type cohérent dans toute l'application.
 */
exports.notify = async (userId, message, type = 'info') => {
  try {
    await notificationModel.create(userId, message, type);
  } catch (err) {
    // Une notification ne doit jamais faire échouer l'action principale
    console.error('[notification]', err.message);
  }
};

exports.welcome = (userId, prenom) =>
  exports.notify(userId, `Bienvenue ${prenom} sur ChoukrApp Academie ! Explorez le catalogue et inscrivez-vous à un cours.`, 'success');

exports.enrolled = (userId, courseTitle) =>
  exports.notify(userId, `Vous êtes inscrit(e) au cours « ${courseTitle} ». Bon apprentissage !`, 'success');

exports.chapterDone = (userId, chapterTitle) =>
  exports.notify(userId, `Chapitre « ${chapterTitle} » terminé. Continuez ainsi !`, 'success');

exports.quizGraded = (userId, quizTitle, score) =>
  exports.notify(
    userId,
    `Quiz « ${quizTitle} » corrigé automatiquement : ${score}/100.${score >= 60 ? ' Objectif atteint !' : ' Vous pouvez réessayer.'}`,
    score >= 60 ? 'success' : 'warning'
  );

exports.courseCompleted = (userId, courseTitle) =>
  exports.notify(userId, `Bravo ! Vous avez terminé le cours « ${courseTitle} ». Votre certificat est disponible.`, 'success');

exports.certificateIssued = (userId, courseTitle, code) =>
  exports.notify(userId, `Votre certificat de réussite pour « ${courseTitle} » a été généré (code ${code}).`, 'success');