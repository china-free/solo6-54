import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ToggleLeft,
  Users,
  TrendingUp,
  Clock,
  User,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout.js';
import { useStore } from '../store/useStore.js';
import {
  ENVIRONMENTS,
  getFeatureStatus,
  getStatusColor,
  getStatusLabel,
  getEnvironmentLabel,
  getEnvironmentColor,
  type Environment
} from '../../shared/types.js';

export default function FeatureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { features, selectedEnvironment, fetchHistory, history, deleteFeature } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');

  const feature = features.find((f) => f.id === id);

  useEffect(() => {
    if (id) {
      fetchHistory(id);
    }
  }, [id, fetchHistory]);

  if (!feature) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">特性不存在</h2>
          <p className="text-slate-500 mb-6">该特性可能已被删除</p>
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            返回列表
          </Link>
        </div>
      </Layout>
    );
  }

  const handleDelete = async () => {
    if (id) {
      const success = await deleteFeature(id);
      if (success) {
        navigate('/');
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{feature.name}</h1>
              {Object.entries(feature.environments).map(([env, config]) => {
                const status = getFeatureStatus(config);
                return (
                  <span
                    key={env}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
                  >
                    {getEnvironmentLabel(env as Environment)}: {getStatusLabel(status)}
                  </span>
                );
              })}
            </div>
            <p className="font-mono text-sm text-slate-400">{feature.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/features/${id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>

        {feature.description && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-600">{feature.description}</p>
          </div>
        )}

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            环境配置
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            变更历史
          </button>
        </div>

        {activeTab === 'config' && (
          <div className="grid grid-cols-3 gap-6">
            {ENVIRONMENTS.map((env) => {
              const config = feature.environments[env as Environment];
              const status = getFeatureStatus(config);
              return (
                <div
                  key={env}
                  className={`bg-white rounded-2xl border-2 overflow-hidden ${
                    selectedEnvironment === env
                      ? 'border-blue-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className={`px-5 py-3 border-b ${getEnvironmentColor(env as Environment)}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{getEnvironmentLabel(env as Environment)}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ToggleLeft className={`w-4 h-4 ${config.enabled ? 'text-green-500' : 'text-slate-300'}`} />
                        启用状态
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-slate-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${config.enabled ? 'translate-x-4' : 'translate-x-0.5'} translate-y-0.5`} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2 text-slate-600">
                          <TrendingUp className="w-4 h-4" />
                          灰度比例
                        </div>
                        <span className="font-semibold text-slate-900">{config.rolloutPercentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
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

                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Users className="w-4 h-4" />
                        白名单用户 ({config.whitelist.length})
                      </div>
                      {config.whitelist.length === 0 ? (
                        <p className="text-sm text-slate-400">暂无白名单用户</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {config.whitelist.slice(0, 10).map((userId) => (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-mono"
                            >
                              {userId}
                            </span>
                          ))}
                          {config.whitelist.length > 10 && (
                            <span className="px-2 py-1 text-xs text-slate-500">
                              +{config.whitelist.length - 10} 更多
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">变更历史</h3>
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">暂无变更记录</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((record) => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        record.operation === 'create' ? 'bg-green-100 text-green-600' :
                        record.operation === 'update' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {record.operation === 'create' ? <Plus className="w-4 h-4" /> :
                         record.operation === 'update' ? <Edit3 className="w-4 h-4" /> :
                         <X className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {record.operation === 'create' ? '创建' :
                             record.operation === 'update' ? '更新' : '删除'}
                          </span>
                          {record.environment && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getEnvironmentColor(record.environment)}`}>
                              {getEnvironmentLabel(record.environment)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {record.operator}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(record.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        {Object.keys(record.changes).length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3 text-sm font-mono text-xs">
                            {Object.entries(record.changes).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2 py-1">
                                <span className="text-slate-500 w-48 flex-shrink-0">{key}:</span>
                                <span className="text-red-500">
                                  {value.old !== null && value.old !== undefined
                                    ? JSON.stringify(value.old)
                                    : '-'}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-green-600">
                                  {value.new !== null && value.new !== undefined
                                    ? JSON.stringify(value.new)
                                    : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400">创建时间：</span>
              {new Date(feature.createdAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="text-slate-400">更新时间：</span>
              {new Date(feature.updatedAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
              确认删除
            </h3>
            <p className="text-slate-500 text-center mb-6">
              确定要删除特性 "{feature.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
