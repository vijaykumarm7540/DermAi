import express from 'express';
import { generateInsight, lookupDataset, analyzeImage, generateReport } from '../controllers/ragController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

router.post('/generate', generateInsight);
router.post('/report', generateReport);
router.post('/dataset-lookup', lookupDataset);
router.post('/analyze', upload.single('image'), analyzeImage);

export default router;
