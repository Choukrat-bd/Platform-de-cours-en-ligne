/**
 * Middleware d'authentification (sessions Express).
 * La session est stockée côté serveur : req.session.userId / .role
 */

exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Authentification requise. Veuillez vous connecter.' });
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.session || !req.session.role) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }
  if (!roles.includes(req.session.role)) {
    return res.status(403).json({ message: 'Accès refusé : rôle insuffisant.' });
  }
  return next();
};

exports.requireOwnerOrRole = (idOwner) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }
  const ownerId = Number(req.params[idOwner]);
  if (req.session.role === 'admin' || req.session.userId === ownerId) {
    return next();
  }
  return res.status(403).json({ message: 'Accès refusé : vous n\'êtes pas propriétaire de cette ressource.' });
};