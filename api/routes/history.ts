import { Router } from 'express';
import { HistoryController } from '../controllers/HistoryController.js';

const router = Router();

router.get('/', HistoryController.getAll);

export default router;
