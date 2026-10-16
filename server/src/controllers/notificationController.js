const Notification = require("../models/Notification");
const { parsePagination, buildPageMeta } = require("../utils/pagination");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/notifications
const list = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.unread === "true") filter.read = false;

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15, maxLimit: 50 });
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);

  res.json({ success: true, notifications: items, unread, ...buildPageMeta(total, { page, limit }) });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { read: true });
  const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ success: true, unread });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { read: true });
  res.json({ success: true });
});

module.exports = { list, markRead, markAllRead };
