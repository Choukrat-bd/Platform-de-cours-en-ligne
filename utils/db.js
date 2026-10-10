const pool = require('../config/db');

/**
 * Helper central pour exécuter une requête SQL paramétrée.
 * Utilise le format `?` (placeholders positionnels) pour éviter toute
 * injection SQL : toutes les valeurs passées par l'utilisateur passent par ici.
 */
exports.query = (sql, params = []) => pool.query(sql, params).then(([rows]) => rows);

exports.getOrThrow = (rows, message = 'Ressource introuvable', status = 404) => {
  if (!rows || rows.length === 0) {
    const err = new Error(message);
    err.status = status;
    throw err;
  }
  return rows[0];
};

exports.parseInt = (value, fallback = null) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

exports.parseJson = (value, fallback = []) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};