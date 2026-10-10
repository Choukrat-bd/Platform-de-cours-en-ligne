const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const notificationService = require('../services/notification.service');

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return { id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, role: u.role, bio: u.bio };
}

/** POST /api/auth/register */
exports.register = async (req, res) => {
  const { nom, prenom, email, password, role, bio } = req.body || {};

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont obligatoires.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Adresse email invalide.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const safeRole = ['etudiant', 'enseignant'].includes(role) ? role : 'etudiant';

  const existing = await userModel.findByEmail(email.toLowerCase().trim());
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await userModel.create(nom.trim(), prenom.trim(), email.toLowerCase().trim(), hash, safeRole, bio);
  const [user] = await userModel.findById(result.insertId);

  req.session.userId = user.id;
  req.session.role = user.role;

  await notificationService.welcome(user.id, user.prenom);
  return res.status(201).json({ message: 'Inscription réussie.', user: publicUser(user) });
};

/** POST /api/auth/login */
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  const rows = await userModel.findByEmail(email.toLowerCase().trim());
  if (rows.length === 0) {
    return res.status(401).json({ message: 'Identifiants incorrects.' });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Identifiants incorrects.' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  return res.json({ message: 'Connexion réussie.', user: publicUser(user) });
};

/** POST /api/auth/logout */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnexion réussie.' });
  });
};

/** GET /api/auth/me */
exports.me = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }
  const rows = await userModel.findById(req.session.userId);
  if (rows.length === 0) {
    return res.json({ user: null });
  }
  return res.json({ user: publicUser(rows[0]) });
};