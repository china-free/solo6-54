import { Feature } from '../models/Feature.js';
import { HistoryService } from './HistoryService.js';
import type { Environment, Feature as FeatureType, FeatureRequest } from '../../shared/types.js';

function toFeatureDTO(doc: any): FeatureType {
  return {
    id: doc._id.toString(),
    name: doc.name,
    key: doc.key,
    description: doc.description,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    environments: {
      development: { ...doc.environments.development.toObject() },
      testing: { ...doc.environments.testing.toObject() },
      production: { ...doc.environments.production.toObject() }
    }
  };
}

const defaultEnvs = {
  development: { enabled: true, rolloutPercentage: 100, whitelist: [] },
  testing: { enabled: false, rolloutPercentage: 0, whitelist: [] },
  production: { enabled: false, rolloutPercentage: 0, whitelist: [] }
};

export class FeatureService {
  static async getAll(): Promise<FeatureType[]> {
    const features = await Feature.find().sort({ createdAt: -1 }).exec();
    return features.map(toFeatureDTO);
  }

  static async getById(id: string): Promise<FeatureType | null> {
    const feature = await Feature.findById(id).exec();
    return feature ? toFeatureDTO(feature) : null;
  }

  static async getByKey(key: string): Promise<FeatureType | null> {
    const feature = await Feature.findOne({ key }).exec();
    return feature ? toFeatureDTO(feature) : null;
  }

  static async create(
    data: FeatureRequest,
    operator: string = 'system'
  ): Promise<FeatureType> {
    const existing = await Feature.findOne({ key: data.key }).exec();
    if (existing) {
      throw new Error(`Feature with key "${data.key}" already exists`);
    }

    const environments: any = {};
    const envs: Environment[] = ['development', 'testing', 'production'];

    for (const env of envs) {
      const envData = data.environments?.[env] || {};
      environments[env] = {
        ...defaultEnvs[env],
        ...envData
      };
    }

    const feature = new Feature({
      name: data.name,
      key: data.key,
      description: data.description || '',
      environments
    });

    await feature.save();
    const dto = toFeatureDTO(feature);
    await HistoryService.recordCreate(dto, operator);

    return dto;
  }

  static async update(
    id: string,
    data: Partial<FeatureRequest>,
    operator: string = 'system'
  ): Promise<FeatureType | null> {
    const feature = await Feature.findById(id).exec();
    if (!feature) return null;

    const oldDTO = toFeatureDTO(feature);

    if (data.name !== undefined) feature.name = data.name;
    if (data.description !== undefined) feature.description = data.description;
    if (data.key !== undefined && data.key !== feature.key) {
      const existing = await Feature.findOne({ key: data.key }).exec();
      if (existing && existing._id.toString() !== id) {
        throw new Error(`Feature with key "${data.key}" already exists`);
      }
      feature.key = data.key;
    }

    if (data.environments) {
      const envs: Environment[] = ['development', 'testing', 'production'];
      for (const env of envs) {
        const envData = data.environments[env];
        if (envData) {
          if (envData.enabled !== undefined) {
            feature.environments[env].enabled = envData.enabled;
          }
          if (envData.rolloutPercentage !== undefined) {
            feature.environments[env].rolloutPercentage = envData.rolloutPercentage;
          }
          if (envData.whitelist !== undefined) {
            feature.environments[env].whitelist = envData.whitelist;
          }
        }
      }
    }

    await feature.save();
    const newDTO = toFeatureDTO(feature);
    await HistoryService.recordUpdate(newDTO, oldDTO, operator);

    return newDTO;
  }

  static async delete(
    id: string,
    operator: string = 'system'
  ): Promise<boolean> {
    const feature = await Feature.findById(id).exec();
    if (!feature) return false;

    const dto = toFeatureDTO(feature);
    await Feature.findByIdAndDelete(id).exec();
    await HistoryService.recordDelete(dto, operator);

    return true;
  }

  static async getStats() {
    const features = await Feature.find().exec();
    const envs: Environment[] = ['development', 'testing', 'production'];

    const stats: Record<Environment, { total: number; active: number; gradual: number; disabled: number }> = {
      development: { total: 0, active: 0, gradual: 0, disabled: 0 },
      testing: { total: 0, active: 0, gradual: 0, disabled: 0 },
      production: { total: 0, active: 0, gradual: 0, disabled: 0 }
    };

    for (const feature of features) {
      for (const env of envs) {
        stats[env].total++;
        const config = feature.environments[env];
        if (!config.enabled) {
          stats[env].disabled++;
        } else if (config.rolloutPercentage === 100) {
          stats[env].active++;
        } else {
          stats[env].gradual++;
        }
      }
    }

    return {
      total: features.length,
      byEnvironment: stats
    };
  }
}
