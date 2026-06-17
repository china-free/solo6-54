import { FeatureService } from './FeatureService.js';
import { evaluateFeature, getBucket } from '../lib/rollout.js';
import type { Environment, EvaluateResponse } from '../../shared/types.js';

export class EvaluationService {
  static async evaluate(
    featureKey: string,
    userId: string,
    environment: Environment
  ): Promise<EvaluateResponse> {
    const feature = await FeatureService.getByKey(featureKey);

    if (!feature) {
      return {
        featureKey,
        enabled: false,
        reason: 'not-found'
      };
    }

    const config = feature.environments[environment];
    return evaluateFeature(userId, featureKey, environment, config);
  }

  static async evaluateBatch(
    featureKeys: string[],
    userId: string,
    environment: Environment
  ): Promise<EvaluateResponse[]> {
    const features = await FeatureService.getAll();
    const featureMap = new Map(features.map(f => [f.key, f]));

    return featureKeys.map(key => {
      const feature = featureMap.get(key);
      if (!feature) {
        return {
          featureKey: key,
          enabled: false,
          reason: 'not-found' as const
        };
      }
      const config = feature.environments[environment];
      return evaluateFeature(userId, key, environment, config);
    });
  }

  static async evaluateAll(
    userId: string,
    environment: Environment
  ): Promise<EvaluateResponse[]> {
    const features = await FeatureService.getAll();

    return features.map(feature => {
      const config = feature.environments[environment];
      return evaluateFeature(userId, feature.key, environment, config);
    });
  }

  static async getUserBucket(
    userId: string,
    featureKey: string
  ): Promise<{ bucket: number; featureKey: string }> {
    return {
      featureKey,
      bucket: getBucket(userId, featureKey)
    };
  }

  static async simulateRollout(
    featureKey: string,
    percentage: number,
    sampleSize: number = 1000
  ): Promise<{ enabled: number; disabled: number; percentage: number }> {
    let enabled = 0;
    for (let i = 0; i < sampleSize; i++) {
      const userId = `user_${i}`;
      const bucket = getBucket(userId, featureKey);
      if (bucket <= percentage) {
        enabled++;
      }
    }
    return {
      enabled,
      disabled: sampleSize - enabled,
      percentage: Math.round((enabled / sampleSize) * 100)
    };
  }
}
