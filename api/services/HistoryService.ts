import { History } from '../models/History.js';
import type { Environment, Feature } from '../../shared/types.js';

interface CreateHistoryParams {
  featureId: string;
  featureName: string;
  operation: 'create' | 'update' | 'delete';
  environment?: Environment;
  operator?: string;
  changes: Record<string, { old: any; new: any }>;
}

export class HistoryService {
  static async create(params: CreateHistoryParams) {
    const history = new History({
      featureId: params.featureId,
      featureName: params.featureName,
      operation: params.operation,
      environment: params.environment,
      operator: params.operator || 'system',
      changes: params.changes
    });
    return history.save();
  }

  static async getByFeatureId(
    featureId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return History.find({ featureId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  static async getAll(
    limit: number = 50,
    offset: number = 0,
    operation?: string,
    environment?: Environment
  ) {
    const filter: any = {};
    if (operation) filter.operation = operation;
    if (environment) filter.environment = environment;

    return History.find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  static async countAll(operation?: string, environment?: Environment) {
    const filter: any = {};
    if (operation) filter.operation = operation;
    if (environment) filter.environment = environment;
    return History.countDocuments(filter).exec();
  }

  static recordCreate(feature: Feature, operator: string = 'system') {
    return this.create({
      featureId: feature.id,
      featureName: feature.name,
      operation: 'create',
      operator,
      changes: {
        feature: {
          old: null,
          new: {
            name: feature.name,
            key: feature.key,
            description: feature.description,
            environments: feature.environments
          }
        }
      }
    });
  }

  static recordUpdate(
    feature: Feature,
    oldFeature: Partial<Feature>,
    operator: string = 'system',
    environment?: Environment
  ) {
    const changes: Record<string, { old: any; new: any }> = {};

    if (oldFeature.name !== feature.name) {
      changes.name = { old: oldFeature.name, new: feature.name };
    }
    if (oldFeature.description !== feature.description) {
      changes.description = { old: oldFeature.description, new: feature.description };
    }

    if (oldFeature.environments) {
      const envs: Environment[] = ['development', 'testing', 'production'];
      for (const env of envs) {
        const oldEnv = oldFeature.environments[env];
        const newEnv = feature.environments[env];

        if (oldEnv.enabled !== newEnv.enabled) {
          changes[`environments.${env}.enabled`] = {
            old: oldEnv.enabled,
            new: newEnv.enabled
          };
        }
        if (oldEnv.rolloutPercentage !== newEnv.rolloutPercentage) {
          changes[`environments.${env}.rolloutPercentage`] = {
            old: oldEnv.rolloutPercentage,
            new: newEnv.rolloutPercentage
          };
        }
        if (JSON.stringify(oldEnv.whitelist) !== JSON.stringify(newEnv.whitelist)) {
          changes[`environments.${env}.whitelist`] = {
            old: oldEnv.whitelist,
            new: newEnv.whitelist
          };
        }
      }
    }

    if (Object.keys(changes).length === 0) {
      return null;
    }

    return this.create({
      featureId: feature.id,
      featureName: feature.name,
      operation: 'update',
      environment,
      operator,
      changes
    });
  }

  static recordDelete(feature: Feature, operator: string = 'system') {
    return this.create({
      featureId: feature.id,
      featureName: feature.name,
      operation: 'delete',
      operator,
      changes: {
        feature: {
          old: {
            name: feature.name,
            key: feature.key,
            description: feature.description
          },
          new: null
        }
      }
    });
  }
}
