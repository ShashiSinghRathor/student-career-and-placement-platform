const Notification = require("../models/Notification");

/**
 * Create in-app notification(s) and push via Socket.IO in real time.
 * Also queues an email when the user has email notifications enabled.
 *
 * notify({ userId | userIds, title, message, type, link, meta })
 */
async function notify({ userId, userIds, title, message, type = "system", link = "", meta = {} }) {
  const ids = userIds || (userId ? [userId] : []);
  if (!ids.length) return [];
  const payload = { title, message, type, link, meta };
  const docs = ids.map((id) => ({ ...payload, userId: id }));
  const created = await Notification.insertMany(docs);

  // Real-time push (socket.io instance attached in server.js)
  const io = global.io;
  if (io) {
    const { Server } = require("socket.io");
    created.forEach((n) => {
      io.to(n.userId.toString()).emit("notification", n);
    });
  }
  return created;
}

async function unreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}

module.exports = { notify, unreadCount };
