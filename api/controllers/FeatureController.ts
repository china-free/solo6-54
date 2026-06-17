import { Request, Response } from 'express';
import { FeatureService } from '../services/FeatureService.js';
import { HistoryService } from '../services/HistoryService.js';
import type { FeatureRequest } from '../../shared/types.js';

export class FeatureController {
  static async getAll(req: Request, res: Response) {
    try {
      const features = await FeatureService.getAll();
      res.json({ data: features });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const feature = await FeatureService.getById(id);

      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }

      res.json({ data: feature });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = req.body as FeatureRequest;
      const operator = (req.headers['x-operator'] as string) || 'system';

      if (!data.name || !data.key) {
        return res.status(400).json({ error: 'Name and key are required' });
      }

      const feature = await FeatureService.create(data, operator);
      res.status(201).json({ data: feature });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        return res.status(409).json({ error: (error as Error).message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body as Partial<FeatureRequest>;
      const operator = (req.headers['x-operator'] as string) || 'system';

      const feature = await FeatureService.update(id, data, operator);

      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }

      res.json({ data: feature });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        return res.status(409).json({ error: (error as Error).message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const operator = (req.headers['x-operator'] as string) || 'system';

      const success = await FeatureService.delete(id, operator);

      if (!success) {
        return res.status(404).json({ error: 'Feature not found' });
      }

      res.json({ message: 'Feature deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await FeatureService.getStats();
      res.json({ data: stats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await HistoryService.getByFeatureId(id, limit, offset);
      res.json({ data: history });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
