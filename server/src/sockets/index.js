const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

/**
 * Socket.IO setup: JWT-authenticated connections joining a personal room
 * `user._id`, used for real-time notifications.
 */
function setupSocket(io) {
  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];
      if (!token) return next(new Error("Auth required"));
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select("role isActive");
      if (!user || !user.isActive) return next(new Error("Unauthorized"));
      socket.user = { id: user._id.toString(), role: user.role };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.user.id);
    socket.emit("connected", { userId: socket.user.id });

    socket.on("disconnect", () => {/* cleanup automatic */});
  });
}

module.exports = setupSocket;
