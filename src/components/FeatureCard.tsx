import { Link } from 'react-router-dom';
import { MoreHorizontal, Users, ToggleLeft, TrendingUp } from 'lucide-react';
import type { Feature, Environment } from '../../shared/types.js';
import { getFeatureStatus, getStatusColor, getStatusLabel, getEnvironmentLabel } from '../../shared/types.js';

interface FeatureCardProps {
  feature: Feature;
  environment: Environment;
}

export default function FeatureCard({ feature, environment }: FeatureCardProps) {
  const config = feature.environments[environment];
  const status = getFeatureStatus(config);

  return (
    <Link
      to={`/features/${feature.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {feature.name}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
          </div>
          <p className="text-sm font-mono text-slate-400">{feature.key}</p>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {feature.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {feature.description}
        </p>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
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

      <div className="mt-4">
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

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{getEnvironmentLabel(environment)}</span>
        <span>更新于 {new Date(feature.updatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </Link>
  );
}
