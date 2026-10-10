const { query } = require('../utils/db');

exports.create = (userId, message, type = 'info') =>
  query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [userId, message, type]);

exports.findByUser = (userId) =>
  query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);

exports.unreadCount = (userId) =>
  query('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);

exports.markRead = (id, userId) =>
  query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);

exports.markAllRead = (userId) =>
  query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);