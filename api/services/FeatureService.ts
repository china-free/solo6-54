import { Feature } from '../models/Feature.js';
import { HistoryService } from './HistoryService.js';
import { History } from '../models/History.js';
import type {
  Environment,
  Feature as FeatureType,
  FeatureRequest,
  FeatureWithInsights,
  ConfigCompleteness,
  FeatureAnomaly
} from '../../shared/types.js';
import {
  calculateConfigCompleteness,
  detectAnomalies,
  checkReleaseReadiness
} from '../../shared/types.js';

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

  private static async getLastChangeForFeatures(featureIds: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>();

    for (const featureId of featureIds) {
      const history = await History.findOne({ featureId })
        .sort({ timestamp: -1 })
        .limit(1)
        .exec();

      if (history) {
        const changes = history.changes || {};
        const changeKeys = Object.keys(changes);
        let summary = '';

        if (history.operation === 'create') {
          summary = '创建特性';
        } else if (history.operation === 'delete') {
          summary = '删除特性';
        } else if (changeKeys.length > 0) {
          const envChanges = changeKeys.filter(k => k.startsWith('environments.'));
          const basicChanges = changeKeys.filter(k => !k.startsWith('environments.'));

          if (basicChanges.length > 0 && envChanges.length > 0) {
            summary = `更新了 ${basicChanges.length} 项基本信息和 ${envChanges.length} 项环境配置`;
          } else if (envChanges.length > 0) {
            const envs = new Set(envChanges.map(k => k.split('.')[1]));
            summary = `更新了 ${Array.from(envs).join('、')} 环境配置`;
          } else {
            summary = `更新了 ${changeKeys.join('、')}`;
          }
        }

        result.set(featureId, {
          operation: history.operation,
          operator: history.operator,
          timestamp: history.timestamp.toISOString(),
          summary
        });
      }
    }

    return result;
  }

  static async getAllWithInsights(): Promise<FeatureWithInsights[]> {
    const features = await this.getAll();
    const featureIds = features.map(f => f.id);
    const lastChanges = await this.getLastChangeForFeatures(featureIds);

    return features.map(feature => {
      const completeness = calculateConfigCompleteness(feature);
      const anomalies = detectAnomalies(feature);
      const releaseReadiness = checkReleaseReadiness(feature, anomalies, completeness);
      const lastChange = lastChanges.get(feature.id) || null;

      return {
        feature,
        completeness,
        anomalies,
        lastChange,
        releaseReadiness
      };
    });
  }

  static async getByIdWithInsights(id: string): Promise<FeatureWithInsights | null> {
    const feature = await this.getById(id);
    if (!feature) return null;

    const lastChanges = await this.getLastChangeForFeatures([id]);
    const completeness = calculateConfigCompleteness(feature);
    const anomalies = detectAnomalies(feature);
    const releaseReadiness = checkReleaseReadiness(feature, anomalies, completeness);
    const lastChange = lastChanges.get(id) || null;

    return {
      feature,
      completeness,
      anomalies,
      lastChange,
      releaseReadiness
    };
  }

  static async getDashboardStats() {
    const insights = await this.getAllWithInsights();

    const envSummary: Record<Environment, {
      total: number;
      active: number;
      gradual: number;
      disabled: number;
      complete: number;
      partial: number;
      incomplete: number;
      errors: number;
      warnings: number;
      readyToRelease: number;
    }> = {
      development: { total: 0, active: 0, gradual: 0, disabled: 0, complete: 0, partial: 0, incomplete: 0, errors: 0, warnings: 0, readyToRelease: 0 },
      testing: { total: 0, active: 0, gradual: 0, disabled: 0, complete: 0, partial: 0, incomplete: 0, errors: 0, warnings: 0, readyToRelease: 0 },
      production: { total: 0, active: 0, gradual: 0, disabled: 0, complete: 0, partial: 0, incomplete: 0, errors: 0, warnings: 0, readyToRelease: 0 }
    };

    let totalCompletenessScore = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalReadyToRelease = 0;

    const envs: Environment[] = ['development', 'testing', 'production'];

    for (const insight of insights) {
      totalCompletenessScore += insight.completeness.score;
      if (insight.releaseReadiness.canRelease) totalReadyToRelease++;

      const errorCount = insight.anomalies.overall.filter(a => a.severity === 'error').length;
      const warningCount = insight.anomalies.overall.filter(a => a.severity === 'warning').length;
      totalErrors += errorCount;
      totalWarnings += warningCount;

      for (const env of envs) {
        const config = insight.feature.environments[env];
        const envErrors = insight.anomalies.byEnvironment[env].filter(a => a.severity === 'error').length;
        const envWarnings = insight.anomalies.byEnvironment[env].filter(a => a.severity === 'warning').length;

        envSummary[env].total++;

        if (!config.enabled) {
          envSummary[env].disabled++;
        } else if (config.rolloutPercentage === 100) {
          envSummary[env].active++;
        } else {
          envSummary[env].gradual++;
        }

        if (insight.completeness.level === 'complete') envSummary[env].complete++;
        else if (insight.completeness.level === 'partial') envSummary[env].partial++;
        else envSummary[env].incomplete++;

        envSummary[env].errors += errorCount + envErrors;
        envSummary[env].warnings += warningCount + envWarnings;
        if (insight.releaseReadiness.canRelease) envSummary[env].readyToRelease++;
      }
    }

    const avgCompleteness = insights.length > 0 ? Math.round(totalCompletenessScore / insights.length) : 0;

    return {
      totalFeatures: insights.length,
      avgCompleteness,
      totalErrors,
      totalWarnings,
      totalReadyToRelease,
      byEnvironment: envSummary,
      recentChanges: insights
        .filter(i => i.lastChange)
        .sort((a, b) => new Date(b.lastChange!.timestamp).getTime() - new Date(a.lastChange!.timestamp).getTime())
        .slice(0, 5)
        .map(i => ({
          featureId: i.feature.id,
          featureName: i.feature.name,
          ...i.lastChange
        }))
    };
  }
}
