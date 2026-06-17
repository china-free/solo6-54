import { Router } from 'express';
import { FeatureController } from '../controllers/FeatureController.js';

const router = Router();

router.get('/', FeatureController.getAll);
router.get('/stats', FeatureController.getStats);
router.get('/:id', FeatureController.getById);
router.get('/:id/history', FeatureController.getHistory);
router.post('/', FeatureController.create);
router.put('/:id', FeatureController.update);
router.delete('/:id', FeatureController.delete);

export default router;
