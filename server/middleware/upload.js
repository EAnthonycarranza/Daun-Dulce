const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// ── Google Cloud Storage setup ──────────────────────────────────
let gcsCredentials;
if (process.env.GCS_KEY_JSON) {
  // Heroku / production: credentials as env var (JSON string)
  gcsCredentials = JSON.parse(process.env.GCS_KEY_JSON);
} else if (process.env.GCS_KEY_FILE) {
  // Local dev: path to JSON key file
  gcsCredentials = require(process.env.GCS_KEY_FILE);
}

const storage = gcsCredentials
  ? new Storage({ projectId: gcsCredentials.project_id, credentials: gcsCredentials })
  : new Storage();

const BUCKET_NAME = process.env.GCS_BUCKET || 'duan_dulce';
const bucket = storage.bucket(BUCKET_NAME);

// ── Multer: buffer files in memory (no disk) ───────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ── Helper: upload a multer file buffer to GCS ──────────────────
async function uploadToGCS(file, folder = 'uploads') {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}/cookie-${uniqueSuffix}${ext}`;

  const blob = bucket.file(filename);
  await blob.save(file.buffer, {
    metadata: { contentType: file.mimetype },
    resumable: false,
  });

  // Public URL
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
}

// ── Helper: delete a file from GCS by its public URL ────────────
async function deleteFromGCS(publicUrl) {
  if (!publicUrl) return;

  // Handle both GCS URLs and old local /uploads/ paths
  let filename;
  const gcsPrefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
  if (publicUrl.startsWith(gcsPrefix)) {
    filename = publicUrl.replace(gcsPrefix, '');
  } else if (publicUrl.startsWith('/uploads/')) {
    // Old local file — skip (can't delete from GCS)
    return;
  } else {
    return;
  }

  try {
    await bucket.file(filename).delete();
  } catch (err) {
    // File might already be deleted, that's fine
    if (err.code !== 404) {
      console.error('GCS delete error:', err.message);
    }
  }
}

module.exports = upload;
module.exports.uploadToGCS = uploadToGCS;
module.exports.deleteFromGCS = deleteFromGCS;
