export type Environment = 'development' | 'testing' | 'production';

export const ENVIRONMENTS: Environment[] = ['development', 'testing', 'production'];

export type FeatureStatus = 'active' | 'disabled' | 'gradual';

export interface EnvironmentConfig {
  enabled: boolean;
  rolloutPercentage: number;
  whitelist: string[];
}

export type ConfigCompletenessLevel = 'complete' | 'partial' | 'incomplete';
export type AnomalyType = 'no-whitelist' | 'high-rollout-no-test' | 'disabled-in-dev' | 'production-unequal' | 'missing-description' | 'zero-rollout-enabled';

export interface EnvironmentAnomaly {
  type: AnomalyType;
  severity: 'warning' | 'error' | 'info';
  message: string;
}

export interface FeatureAnomaly {
  overall: EnvironmentAnomaly[];
  byEnvironment: Record<Environment, EnvironmentAnomaly[]>;
}

export interface ConfigCompleteness {
  score: number;
  level: ConfigCompletenessLevel;
  checks: {
    hasDescription: boolean;
    devConfigured: boolean;
    testingConfigured: boolean;
    productionConfigured: boolean;
    hasWhitelist: boolean;
  };
}

export interface FeatureWithInsights {
  feature: Feature;
  completeness: ConfigCompleteness;
  anomalies: FeatureAnomaly;
  lastChange: {
    operation: 'create' | 'update' | 'delete';
    operator: string;
    timestamp: string;
    summary: string;
  } | null;
  releaseReadiness: {
    canRelease: boolean;
    reasons: string[];
  };
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

export function getCompletenessColor(level: ConfigCompletenessLevel): string {
  switch (level) {
    case 'complete':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'partial':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'incomplete':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

export function getCompletenessLabel(level: ConfigCompletenessLevel): string {
  switch (level) {
    case 'complete':
      return '配置完整';
    case 'partial':
      return '部分配置';
    case 'incomplete':
      return '配置缺失';
  }
}

export function getSeverityColor(severity: 'warning' | 'error' | 'info'): string {
  switch (severity) {
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'warning':
      return 'text-amber-600 bg-amber-50';
    case 'info':
      return 'text-blue-600 bg-blue-50';
  }
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export function calculateConfigCompleteness(feature: Feature): ConfigCompleteness {
  const checks = {
    hasDescription: !!feature.description && feature.description.trim().length > 0,
    devConfigured: feature.environments.development.enabled || feature.environments.development.rolloutPercentage > 0 || feature.environments.development.whitelist.length > 0,
    testingConfigured: feature.environments.testing.enabled || feature.environments.testing.rolloutPercentage > 0 || feature.environments.testing.whitelist.length > 0,
    productionConfigured: feature.environments.production.enabled || feature.environments.production.rolloutPercentage > 0 || feature.environments.production.whitelist.length > 0,
    hasWhitelist: Object.values(feature.environments).some(env => env.whitelist.length > 0)
  };

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  let level: ConfigCompletenessLevel = 'incomplete';
  if (score >= 80) level = 'complete';
  else if (score >= 50) level = 'partial';

  return { score, level, checks };
}

export function detectAnomalies(feature: Feature): FeatureAnomaly {
  const overall: EnvironmentAnomaly[] = [];
  const byEnvironment: Record<Environment, EnvironmentAnomaly[]> = {
    development: [],
    testing: [],
    production: []
  };

  if (!feature.description || feature.description.trim().length === 0) {
    overall.push({
      type: 'missing-description',
      severity: 'warning',
      message: '缺少功能描述，建议补充说明该特性的用途和影响范围'
    });
  }

  const hasAnyWhitelist = Object.values(feature.environments).some(env => env.whitelist.length > 0);
  if (!hasAnyWhitelist) {
    overall.push({
      type: 'no-whitelist',
      severity: 'info',
      message: '未配置任何白名单用户，建议添加核心测试人员以便提前验证'
    });
  }

  if (feature.environments.production.enabled && feature.environments.production.rolloutPercentage >= 50) {
    if (!feature.environments.testing.enabled) {
      overall.push({
        type: 'high-rollout-no-test',
        severity: 'error',
        message: '生产环境灰度 >=50% 但测试环境未启用，存在风险！'
      });
    }
  }

  if (feature.environments.development.enabled === false) {
    byEnvironment.development.push({
      type: 'disabled-in-dev',
      severity: 'warning',
      message: '开发环境已禁用，开发人员无法测试该特性'
    });
  }

  if (feature.environments.production.enabled && feature.environments.production.rolloutPercentage === 0) {
    byEnvironment.production.push({
      type: 'zero-rollout-enabled',
      severity: 'warning',
      message: '生产环境已启用但灰度为 0%，仅白名单用户可见'
    });
  }

  const devStatus = getFeatureStatus(feature.environments.development);
  const prodStatus = getFeatureStatus(feature.environments.production);
  if (devStatus === 'active' && prodStatus === 'disabled') {
    overall.push({
      type: 'production-unequal',
      severity: 'info',
      message: '开发环境已全量但生产未启用，考虑是否需要同步上线'
    });
  }

  return { overall, byEnvironment };
}

export function checkReleaseReadiness(
  feature: Feature,
  anomalies: FeatureAnomaly,
  completeness: ConfigCompleteness
): { canRelease: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const prodConfig = feature.environments.production;

  if (!prodConfig.enabled) {
    reasons.push('生产环境未启用');
  }

  if (completeness.level === 'incomplete') {
    reasons.push(`配置完整度仅 ${completeness.score}%，建议完善配置`);
  }

  const errors = anomalies.overall.filter(a => a.severity === 'error');
  if (errors.length > 0) {
    errors.forEach(e => reasons.push(e.message));
  }

  if (!feature.environments.testing.enabled && prodConfig.enabled && prodConfig.rolloutPercentage > 0) {
    reasons.push('测试环境未验证，建议先在测试环境充分测试');
  }

  return {
    canRelease: reasons.length === 0,
    reasons
  };
}
