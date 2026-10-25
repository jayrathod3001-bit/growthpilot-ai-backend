import express from 'express';
import { generateImage, getImageHistory } from '../controllers/imageController.js';
import authanticateToken from '../utils/authMiddleware.js';
import optionalAuthMiddleware from '../utils/optionalAuthMiddleware.js';

const router = express.Router();

router.post('/api/generate-image', authanticateToken, generateImage);
router.get('/api/generate-image/history', optionalAuthMiddleware, getImageHistory);

export default router;
