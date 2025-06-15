import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import iconv from 'iconv-lite';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer le chemin du dossier de destination
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

const sanitizeFilename = (original: string): string => {
  // Corrige l'encodage si besoin (souvent iso-8859-1 mal interprété)
  const utf8Name = iconv.decode(Buffer.from(original, 'binary'), 'utf8');

  const normalized = utf8Name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const withoutSpecials = normalized.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const timestamp = Date.now();

  return `${timestamp}-${withoutSpecials}`;
};

router.post('/', upload.array('files'), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]).map(file => {
    const sanitizedName = sanitizeFilename(file.originalname);
    const newPath = path.join(file.destination, sanitizedName);

    fs.renameSync(file.path, newPath);

    return {
      url: `http://localhost:3000/uploads/${sanitizedName}`,
      name: file.originalname
    };
  });

  res.status(200).json({ files });
});



export default router;
