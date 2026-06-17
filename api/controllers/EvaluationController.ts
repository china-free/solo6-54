import { Request, Response } from 'express';
import { EvaluationService } from '../services/EvaluationService.js';
import type { Environment } from '../../shared/types.js';

const VALID_ENVIRONMENTS: Environment[] = ['development', 'testing', 'production'];

export class EvaluationController {
  static async evaluate(req: Request, res: Response) {
    try {
      const featureKey = (req.query.featureKey || req.body.featureKey) as string;
      const userId = (req.query.userId || req.body.userId) as string;
      const environment = (req.query.environment || req.body.environment) as Environment;

      if (!featureKey) {
        return res.status(400).json({ error: 'featureKey is required' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
        return res.status(400).json({
          error: 'Valid environment is required (development, testing, production)'
        });
      }

      const result = await EvaluationService.evaluate(featureKey, userId, environment);
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async evaluateBatch(req: Request, res: Response) {
    try {
      const featureKeys = (req.query.featureKeys
        ? (req.query.featureKeys as string).split(',')
        : req.body.featureKeys) as string[];
      const userId = (req.query.userId || req.body.userId) as string;
      const environment = (req.query.environment || req.body.environment) as Environment;

      if (!featureKeys || featureKeys.length === 0) {
        return res.status(400).json({ error: 'featureKeys is required' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
        return res.status(400).json({
          error: 'Valid environment is required (development, testing, production)'
        });
      }

      const results = await EvaluationService.evaluateBatch(
        featureKeys,
        userId,
        environment
      );
      res.json({ data: results });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async evaluateAll(req: Request, res: Response) {
    try {
      const userId = (req.query.userId || req.body.userId) as string;
      const environment = (req.query.environment || req.body.environment) as Environment;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
        return res.status(400).json({
          error: 'Valid environment is required (development, testing, production)'
        });
      }

      const results = await EvaluationService.evaluateAll(userId, environment);
      res.json({ data: results });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getBucket(req: Request, res: Response) {
    try {
      const { userId, featureKey } = req.query;

      if (!userId || !featureKey) {
        return res.status(400).json({ error: 'userId and featureKey are required' });
      }

      const result = await EvaluationService.getUserBucket(
        userId as string,
        featureKey as string
      );
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async simulate(req: Request, res: Response) {
    try {
      const { featureKey, percentage, sampleSize } = req.query;

      if (!featureKey || !percentage) {
        return res.status(400).json({ error: 'featureKey and percentage are required' });
      }

      const result = await EvaluationService.simulateRollout(
        featureKey as string,
        parseInt(percentage as string),
        sampleSize ? parseInt(sampleSize as string) : 1000
      );
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
