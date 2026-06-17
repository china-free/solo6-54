import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
import Layout from '../components/Layout.js';
import { useStore } from '../store/useStore.js';
import {
  ENVIRONMENTS,
  getEnvironmentLabel,
  getEnvironmentColor,
  type Environment,
  type EnvironmentConfig
} from '../../shared/types.js';

export default function FeatureForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { features, createFeature, updateFeature, loading } = useStore();

  const existingFeature = isEditing ? features.find((f) => f.id === id) : null;

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    environments: {
      development: { enabled: true, rolloutPercentage: 100, whitelist: [] as string[] },
      testing: { enabled: false, rolloutPercentage: 0, whitelist: [] as string[] },
      production: { enabled: false, rolloutPercentage: 0, whitelist: [] as string[] }
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [whitelistInputs, setWhitelistInputs] = useState<Record<Environment, string>>({
    development: '',
    testing: '',
    production: ''
  });

  useEffect(() => {
    if (existingFeature) {
      setFormData({
        name: existingFeature.name,
        key: existingFeature.key,
        description: existingFeature.description,
        environments: JSON.parse(JSON.stringify(existingFeature.environments))
      });
    }
  }, [existingFeature]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入特性名称';
    }
    if (!formData.key.trim()) {
      newErrors.key = '请输入特性标识';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      newErrors.key = '标识只能包含小写字母、数字和下划线';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing && id) {
        await updateFeature(id, formData);
      } else {
        await createFeature(formData);
      }
      navigate('/');
    } catch (error) {
      setErrors({ submit: (error as Error).message });
    }
  };

  const updateEnvironment = (
    env: Environment,
    field: keyof EnvironmentConfig,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      environments: {
        ...prev.environments,
        [env]: {
          ...prev.environments[env],
          [field]: value
        }
      }
    }));
  };

  const addToWhitelist = (env: Environment) => {
    const input = whitelistInputs[env].trim();
    if (!input) return;

    const users = input.split(',').map((u) => u.trim()).filter(Boolean);
    if (users.length === 0) return;

    setFormData((prev) => {
      const currentWhitelist = prev.environments[env].whitelist;
      const newWhitelist = [...new Set([...currentWhitelist, ...users])];
      return {
        ...prev,
        environments: {
          ...prev.environments,
          [env]: {
            ...prev.environments[env],
            whitelist: newWhitelist
          }
        }
      };
    });

    setWhitelistInputs((prev) => ({ ...prev, [env]: '' }));
  };

  const removeFromWhitelist = (env: Environment, userId: string) => {
    setFormData((prev) => ({
      ...prev,
      environments: {
        ...prev.environments,
        [env]: {
          ...prev.environments[env],
          whitelist: prev.environments[env].whitelist.filter((u) => u !== userId)
        }
      }
    }));
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? '编辑特性' : '创建特性'}
            </h1>
            <p className="text-sm text-slate-500">
              {isEditing ? '修改特性配置和灰度策略' : '创建一个新的特性开关'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  特性名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：新用户引导流程"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.name ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  特性标识 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="例如：new_user_onboarding_v2"
                  disabled={isEditing}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isEditing ? 'bg-slate-50 text-slate-500' : ''
                  } ${
                    errors.key ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.key && <p className="text-red-500 text-xs mt-1">{errors.key}</p>}
                {!isEditing && (
                  <p className="text-slate-400 text-xs mt-1">标识创建后不可修改，只能包含小写字母、数字和下划线</p>
                )}
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                功能描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="描述这个特性的用途..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">环境配置</h2>
            <div className="grid grid-cols-3 gap-6">
              {ENVIRONMENTS.map((env) => {
                const config = formData.environments[env as Environment];
                return (
                  <div
                    key={env}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <div className={`px-5 py-3 border-b ${getEnvironmentColor(env as Environment)}`}>
                      <h3 className="font-semibold">{getEnvironmentLabel(env as Environment)}</h3>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">启用</label>
                        <button
                          type="button"
                          onClick={() => updateEnvironment(env as Environment, 'enabled', !config.enabled)}
                          className={`relative w-12 h-7 rounded-full transition-colors ${
                            config.enabled ? 'bg-green-500' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                              config.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <label className="font-medium text-slate-700">灰度比例</label>
                          <span className="font-semibold text-slate-900">{config.rolloutPercentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.rolloutPercentage}
                          onChange={(e) => updateEnvironment(
                            env as Environment,
                            'rolloutPercentage',
                            parseInt(e.target.value)
                          )}
                          className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          白名单用户
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={whitelistInputs[env as Environment]}
                            onChange={(e) => setWhitelistInputs((prev) => ({
                              ...prev,
                              [env as Environment]: e.target.value
                            }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addToWhitelist(env as Environment);
                              }
                            }}
                            placeholder="输入用户ID，多个用逗号分隔"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => addToWhitelist(env as Environment)}
                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {config.whitelist.length === 0 ? (
                            <p className="text-sm text-slate-400">暂无白名单用户</p>
                          ) : (
                            config.whitelist.map((userId) => (
                              <span
                                key={userId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-mono"
                              >
                                {userId}
                                <button
                                  type="button"
                                  onClick={() => removeFromWhitelist(env as Environment, userId)}
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 sticky bottom-0 bg-slate-50 pt-4 pb-4 -mx-8 px-8 -mb-8 mt-8 border-t border-slate-200">
            <Link
              to="/"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isEditing ? '保存修改' : '创建特性'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
