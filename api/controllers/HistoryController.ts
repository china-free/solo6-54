import { Request, Response } from 'express';
import { HistoryService } from '../services/HistoryService.js';
import type { Environment } from '../../shared/types.js';

export class HistoryController {
  static async getAll(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const operation = req.query.operation as string | undefined;
      const environment = req.query.environment as Environment | undefined;

      const [history, total] = await Promise.all([
        HistoryService.getAll(limit, offset, operation, environment),
        HistoryService.countAll(operation, environment)
      ]);

      res.json({
        data: history,
        pagination: {
          limit,
          offset,
          total
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
