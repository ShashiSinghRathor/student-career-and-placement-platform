const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const env = require("./config/env");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/error");
const setupSocket = require("./sockets");

const app = express();
const server = http.createServer(app);

// ── Realtime ──────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: env.clientUrl.split(","), credentials: true },
});
setupSocket(io);

// ── Security & parsing ────────────────────────────────────
app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.clientUrl.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(compression());
if (!env.isProd) app.use(morgan("dev"));

// ── Static uploads (local fallback storage) ───────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), { maxAge: "1d" }));

// ── Routes ────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ success: true, status: "ok", time: new Date().toISOString() }));

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/recruiter", require("./routes/recruiterRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/saved-jobs", require("./routes/savedJobRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ── Errors ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    server.listen(env.port, () => {
      console.log(`🚀 CareerConnect API running on http://localhost:${env.port} (${env.env})`);
      console.log(`📡 Socket.IO ready — CORS origin: ${env.clientUrl}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

module.exports = { app, server, io };
