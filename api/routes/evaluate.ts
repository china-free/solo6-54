import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController.js';

const router = Router();

router.get('/', EvaluationController.evaluate);
router.get('/batch', EvaluationController.evaluateBatch);
router.get('/all', EvaluationController.evaluateAll);
router.get('/bucket', EvaluationController.getBucket);
router.get('/simulate', EvaluationController.simulate);

export default router;
