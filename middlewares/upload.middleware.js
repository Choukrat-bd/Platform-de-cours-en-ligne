const multer = require('multer');
const path = require('path');
const config = require('../config/config');

/**
 * Configuration du stockage Multer.
 * Deux champs possibles :
 *  - "pdf"   -> uploads/pdfs    (type MIME application/pdf)
 *  - "video" -> uploads/videos  (type MIME video/*)
 * Le nom de chaque fichier est horodaté pour éviter les collisions.
 */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = file.fieldname === 'pdf'
      ? config.paths.uploadsPdf
      : config.paths.uploadsVideo;
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/gi, '-')
      .slice(0, 60);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
    return cb(new Error('Le support doit être un fichier PDF.'), false);
  }
  if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
    return cb(new Error('Le fichier doit être une vidéo.'), false);
  }
  cb(null, true);
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 250 * 1024 * 1024 } // 250 Mo max (vidéos)
});

exports.uploadFields = this.upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'video', maxCount: 1 }]);
exports.uploadSingle = (field) => this.upload.single(field);