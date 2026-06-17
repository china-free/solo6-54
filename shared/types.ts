export type Environment = 'development' | 'testing' | 'production';

export const ENVIRONMENTS: Environment[] = ['development', 'testing', 'production'];

export type FeatureStatus = 'active' | 'disabled' | 'gradual';

export interface EnvironmentConfig {
  enabled: boolean;
  rolloutPercentage: number;
  whitelist: string[];
}

export interface Feature {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  environments: Record<Environment, EnvironmentConfig>;
}

export interface HistoryRecord {
  id: string;
  featureId: string;
  featureName: string;
  operation: 'create' | 'update' | 'delete';
  environment?: Environment;
  operator: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: string;
}

export interface EvaluateResponse {
  featureKey: string;
  enabled: boolean;
  reason: 'whitelist' | 'rollout' | 'disabled' | 'not-found';
}

export interface FeatureRequest {
  name: string;
  key: string;
  description: string;
  environments: Record<Environment, Partial<EnvironmentConfig>>;
}

export function getFeatureStatus(
  config: EnvironmentConfig
): FeatureStatus {
  if (!config.enabled) return 'disabled';
  if (config.rolloutPercentage === 100) return 'active';
  return 'gradual';
}

export function getStatusColor(status: FeatureStatus): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'disabled':
      return 'text-red-600 bg-red-50';
    case 'gradual':
      return 'text-amber-600 bg-amber-50';
  }
}

export function getStatusLabel(status: FeatureStatus): string {
  switch (status) {
    case 'active':
      return '全量启用';
    case 'disabled':
      return '已禁用';
    case 'gradual':
      return '灰度中';
  }
}

export function getEnvironmentLabel(env: Environment): string {
  switch (env) {
    case 'development':
      return '开发环境';
    case 'testing':
      return '测试环境';
    case 'production':
      return '生产环境';
  }
}

export function getEnvironmentColor(env: Environment): string {
  switch (env) {
    case 'development':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'testing':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'production':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}
