const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const cloudinary = require("cloudinary").v2;
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const CLOUD_CONFIGURED = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (CLOUD_CONFIGURED) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!CLOUD_CONFIGURED && !fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (allowedMimes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME[file.mimetype] || !ALLOWED_MIME[file.mimetype].includes(ext)) {
    return cb(ApiError.badRequest("Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP"));
  }
  cb(null, true);
};

// ── Disk storage fallback (works without Cloudinary keys) ────
const diskStorage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const memoryStorage = multer.memoryStorage();

// ── Upload to Cloudinary buffer helper ───────────────────────
async function uploadBufferToCloudinary(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `careerconnect/${folder}`, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// ── Exported middlewares ─────────────────────────────────────
const makeUploader = (allowedMimes, useRawPdf) => {
  const multerOpts = {
    storage: CLOUD_CONFIGURED ? memoryStorage : diskStorage,
    limits: { fileSize: MAX_SIZE, files: 1 },
    fileFilter: fileFilter(allowedMimes),
  };
  if (useRawPdf) {
    // Cloudinary stores PDFs correctly either way; memory buffer is fine.
    return multer(multerOpts);
  }
  return multer(multerOpts);
};

/**
 * Resume/document upload → saves to Cloudinary (or local disk fallback)
 * and puts a public URL on req.file.url
 */
const resumeUpload = makeUploader(["application/pdf"], true);

const imageUpload = makeUploader(["image/jpeg", "image/png", "image/webp"], false);

async function placeFile(req, folder) {
  if (!req.file) return;
  if (CLOUD_CONFIGURED && req.file.buffer) {
    const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image";
    const result = await uploadBufferToCloudinary(req.file.buffer, folder, resourceType);
    req.file.url = result.secure_url;
  } else {
    // Local fallback served at /uploads/...
    req.file.url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }
}

const uploadResumeMiddleware = [
  resumeUpload.single("resume"),
  asyncHandler(async (req, res, next) => {
    await placeFile(req, "resumes");
    next();
  }),
];

const uploadImageMiddleware = [
  imageUpload.single("file"),
  asyncHandler(async (req, res, next) => {
    await placeFile(req, "images");
    next();
  }),
];

module.exports = {
  uploadResumeMiddleware,
  uploadImageMiddleware,
  cloudinary,
  uploadsPath: UPLOAD_DIR,
};
