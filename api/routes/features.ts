import { Router } from 'express';
import { FeatureController } from '../controllers/FeatureController.js';

const router = Router();

router.get('/', FeatureController.getAll);
router.get('/stats', FeatureController.getStats);
router.get('/dashboard', FeatureController.getDashboardStats);
router.get('/insights', FeatureController.getAllWithInsights);
router.get('/:id/insights', FeatureController.getByIdWithInsights);
router.get('/:id/history', FeatureController.getHistory);
router.get('/:id', FeatureController.getById);
router.post('/', FeatureController.create);
router.put('/:id', FeatureController.update);
router.delete('/:id', FeatureController.delete);

export default router;
