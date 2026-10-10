const pool = require('../config/db');
const { query, parseInt, parseJson } = require('../utils/db');

// ---------- Quiz ----------
exports.findByCourse = (courseId) =>
  query('SELECT id, course_id, title, created_at FROM quizzes WHERE course_id = ? ORDER BY id', [courseId]);

exports.findById = (id) => query('SELECT * FROM quizzes WHERE id = ?', [id]);

exports.create = (courseId, title) =>
  query('INSERT INTO quizzes (course_id, title) VALUES (?, ?)', [courseId, title]);

exports.remove = (id) => query('DELETE FROM quizzes WHERE id = ?', [id]);

// ---------- Questions ----------
exports.findQuestions = (quizId) =>
  query('SELECT id, quiz_id, text, options, correct_index, explanation, points FROM questions WHERE quiz_id = ? ORDER BY id', [quizId]);

exports.addQuestion = (quizId, { text, options, correctIndex, explanation, points }) =>
  query(
    'INSERT INTO questions (quiz_id, text, options, correct_index, explanation, points) VALUES (?, ?, ?, ?, ?, ?)',
    [quizId, text, JSON.stringify(options), correctIndex, explanation || null, parseInt(points, 1) || 1]
  );

exports.addManyQuestions = (quizId, questions) => Promise.all(questions.map((q) => exports.addQuestion(quizId, q)));

// ---------- Tentatives & correction automatique ----------
exports.studentAttempts = (userId, quizId) =>
  query(
    'SELECT id, score, answers, submitted_at FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY submitted_at DESC',
    [userId, quizId]
  );

exports.bestScore = (userId, quizId) =>
  query(
    'SELECT COALESCE(MAX(score), 0) AS best FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?',
    [userId, quizId]
  );

exports.recordAttempt = (userId, quizId, score, answers) =>
  query(
    'INSERT INTO quiz_attempts (user_id, quiz_id, score, answers) VALUES (?, ?, ?, ?)',
    [userId, quizId, score, JSON.stringify(answers)]
  );

/**
 * Correction automatique d'une tentative.
 * - Récupère les questions du quiz
 * - Compare la réponse de l'étudiant à correct_index
 * - Calcule le score /100 et génère le feedback détaillé (bonnes réponses, explications)
 */
exports.correctAndSave = async (userId, quizId, userAnswers) => {
  const questions = await exports.findQuestions(quizId);
  if (questions.length === 0) {
    const err = new Error('Ce quiz ne contient aucune question.');
    err.status = 400;
    throw err;
  }

  let points = 0;
  let total = 0;
  const details = questions.map((q, i) => {
    const idx = userAnswers[i];
    const isCorrect = parseInt(idx, -1) === q.correct_index;
    total += q.points;
    if (isCorrect) points += q.points;
    return {
      question_id: q.id,
      text: q.text,
      options: parseJson(q.options),
      user_answer: idx,
      correct_answer: q.correct_index,
      isCorrect,
      explanation: q.explanation
    };
  });

  const score = Math.round((points / Math.max(total, 1)) * 100);
  await exports.recordAttempt(userId, quizId, score, { answers: userAnswers, correct: points, total });

  return { score, correct: points, total, details };
};

exports.averageForCourse = (userId, courseId) =>
  query(
    `SELECT COALESCE(ROUND(AVG(a.score), 1), 0) AS avg_grade
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = ? AND q.course_id = ?`,
    [userId, courseId]
  );

exports.allAttemptsForUser = (userId) =>
  query(
    `SELECT a.id, a.score AS note, a.submitted_at, q.title AS quiz_title, c.title AS course_title
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN courses c ON c.id = q.course_id
      WHERE a.user_id = ?
      ORDER BY a.submitted_at DESC`,
    [userId]
  );