import crypto from 'crypto';
import type { Environment, EnvironmentConfig, EvaluateResponse } from '../../shared/types.js';

export function isUserInRollout(
  userId: string,
  percentage: number,
  featureKey: string
): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;

  const hash = crypto
    .createHash('md5')
    .update(`${featureKey}:${userId}`)
    .digest('hex');

  const hashValue = parseInt(hash.substring(0, 8), 16);
  const bucket = (hashValue % 100) + 1;

  return bucket <= percentage;
}

export function evaluateFeature(
  userId: string,
  featureKey: string,
  environment: Environment,
  config: EnvironmentConfig | null
): EvaluateResponse {
  if (!config) {
    return {
      featureKey,
      enabled: false,
      reason: 'not-found'
    };
  }

  if (!config.enabled) {
    return {
      featureKey,
      enabled: false,
      reason: 'disabled'
    };
  }

  if (config.whitelist.includes(userId)) {
    return {
      featureKey,
      enabled: true,
      reason: 'whitelist'
    };
  }

  const inRollout = isUserInRollout(userId, config.rolloutPercentage, featureKey);
  return {
    featureKey,
    enabled: inRollout,
    reason: inRollout ? 'rollout' : 'disabled'
  };
}

export function getBucket(userId: string, featureKey: string): number {
  const hash = crypto
    .createHash('md5')
    .update(`${featureKey}:${userId}`)
    .digest('hex');

  const hashValue = parseInt(hash.substring(0, 8), 16);
  return (hashValue % 100) + 1;
}
