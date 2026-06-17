import { Request, Response, NextFunction } from 'express';
import type { Environment } from '../../shared/types.js';

const VALID_ENVIRONMENTS: Environment[] = ['development', 'testing', 'production'];

export function validateEnvironment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const environment = (req.query.environment || req.body.environment) as Environment;

  if (environment && !VALID_ENVIRONMENTS.includes(environment)) {
    return res.status(400).json({
      error: 'Invalid environment. Must be one of: development, testing, production'
    });
  }

  next();
}

export function requireEnvironment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const environment = (req.query.environment || req.body.environment) as Environment;

  if (!environment) {
    return res.status(400).json({
      error: 'Environment is required'
    });
  }

  if (!VALID_ENVIRONMENTS.includes(environment)) {
    return res.status(400).json({
      error: 'Invalid environment. Must be one of: development, testing, production'
    });
  }

  next();
}
