const notificationModel = require('../models/notification.model');

/** GET /api/notifications */
exports.list = async (req, res) => {
  const notifications = await notificationModel.findByUser(req.session.userId);
  const [unread] = await notificationModel.unreadCount(req.session.userId);
  return res.json({ notifications, unread: unread.total });
};

/** POST /api/notifications/:id/read */
exports.markRead = async (req, res) => {
  await notificationModel.markRead(Number(req.params.id), req.session.userId);
  return res.json({ message: 'Notification marquée comme lue.' });
};

/** POST /api/notifications/read-all */
exports.markAllRead = async (req, res) => {
  await notificationModel.markAllRead(req.session.userId);
  return res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
};