import { Link } from 'react-router-dom';
import {
  MoreHorizontal,
  Users,
  ToggleLeft,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Zap
} from 'lucide-react';
import type { Feature, Environment, FeatureWithInsights } from '../../shared/types.js';
import {
  getFeatureStatus,
  getStatusColor,
  getStatusLabel,
  getEnvironmentLabel,
  getCompletenessColor,
  getCompletenessLabel,
  getSeverityColor,
  formatRelativeTime
} from '../../shared/types.js';

interface FeatureCardProps {
  feature: Feature;
  environment: Environment;
  insights?: FeatureWithInsights;
}

export default function FeatureCard({ feature, environment, insights }: FeatureCardProps) {
  const config = feature.environments[environment];
  const status = getFeatureStatus(config);

  const completeness = insights?.completeness;
  const anomalies = insights?.anomalies;
  const lastChange = insights?.lastChange;
  const releaseReadiness = insights?.releaseReadiness;

  const envAnomalies = anomalies?.byEnvironment[environment] || [];
  const overallErrors = anomalies?.overall.filter(a => a.severity === 'error') || [];
  const overallWarnings = anomalies?.overall.filter(a => a.severity === 'warning') || [];
  const envErrors = envAnomalies.filter(a => a.severity === 'error');
  const envWarnings = envAnomalies.filter(a => a.severity === 'warning');
  const totalErrors = overallErrors.length + envErrors.length;
  const totalWarnings = overallWarnings.length + envWarnings.length;

  return (
    <Link
      to={`/features/${feature.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {feature.name}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
            {releaseReadiness && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                releaseReadiness.canRelease
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-amber-600 bg-amber-50'
              }`}>
                {releaseReadiness.canRelease ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    可发布
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    待完善
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-slate-400">{feature.key}</p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {completeness && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-500">
              <Zap className="w-3.5 h-3.5" />
              配置完整度
            </span>
            <span className={`font-medium ${getCompletenessColor(completeness.level).split(' ')[0]}`}>
              {completeness.score}% · {getCompletenessLabel(completeness.level)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completeness.level === 'complete'
                  ? 'bg-emerald-500'
                  : completeness.level === 'partial'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${completeness.score}%` }}
            />
          </div>
        </div>
      )}

      {feature.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">
          {feature.description}
        </p>
      )}

      {(totalErrors > 0 || totalWarnings > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {totalErrors > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-red-600 bg-red-50">
              <XCircle className="w-3 h-3" />
              {totalErrors} 个错误
            </span>
          )}
          {totalWarnings > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full text-amber-600 bg-amber-50">
              <AlertTriangle className="w-3 h-3" />
              {totalWarnings} 个警告
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm">
          <ToggleLeft className={`w-4 h-4 ${config.enabled ? 'text-green-500' : 'text-slate-300'}`} />
          <span className={config.enabled ? 'text-green-600' : 'text-slate-400'}>
            {config.enabled ? '已启用' : '已禁用'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <TrendingUp className="w-4 h-4" />
          <span>{config.rolloutPercentage}% 灰度</span>
        </div>
        {config.whitelist.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{config.whitelist.length} 白名单</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>灰度进度</span>
          <span className="font-medium">{config.rolloutPercentage}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${config.rolloutPercentage}%`,
              background: status === 'active'
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : status === 'gradual'
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #94a3b8, #64748b)'
            }}
          />
        </div>
      </div>

      {lastChange && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-slate-400">最近变更:</span>
            <span className="font-medium text-slate-700">
              {lastChange.summary}
            </span>
            <span className="text-slate-400">·</span>
            <User className="w-3.5 h-3.5" />
            <span className="text-slate-600">{lastChange.operator}</span>
            <span className="text-slate-400">·</span>
            <span>{formatRelativeTime(lastChange.timestamp)}</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{getEnvironmentLabel(environment)}</span>
        <span>更新于 {new Date(feature.updatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </Link>
  );
}
