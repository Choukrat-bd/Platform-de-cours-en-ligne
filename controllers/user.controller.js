const userModel = require('../models/user.model');

/** GET /api/users/me */
exports.me = async (req, res) => {
  const rows = await userModel.findById(req.session.userId);
  if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
  return res.json({ user: rows[0] });
};

/** PUT /api/users/me */
exports.updateMe = async (req, res) => {
  const { nom, prenom, bio } = req.body || {};
  if (!nom || !prenom) {
    return res.status(400).json({ message: 'Nom et prénom sont obligatoires.' });
  }
  await userModel.updateProfile(req.session.userId, { nom: nom.trim(), prenom: prenom.trim(), bio: bio || null });
  const rows = await userModel.findById(req.session.userId);
  return res.json({ message: 'Profil mis à jour.', user: rows[0] });
};