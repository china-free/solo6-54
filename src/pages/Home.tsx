import { useEffect } from 'react';
import { Layers, CheckCircle2, AlertTriangle, Ban, Search } from 'lucide-react';
import Layout from '../components/Layout.js';
import StatCard from '../components/StatCard.js';
import FeatureCard from '../components/FeatureCard.js';
import { useStore } from '../store/useStore.js';
import { ENVIRONMENTS, getEnvironmentLabel, type Environment } from '../../shared/types.js';

export default function Home() {
  const {
    features,
    stats,
    selectedEnvironment,
    loading,
    fetchFeatures,
    fetchStats,
    setEnvironment
  } = useStore();

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, [fetchFeatures, fetchStats]);

  const envStats = stats?.byEnvironment[selectedEnvironment];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">灰度发布管理平台</h1>
              <p className="text-blue-100 max-w-xl">
                安全、可控地发布新功能。支持按百分比灰度、用户白名单、多环境隔离，
                让每一次发布都更加稳健。
              </p>
            </div>
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Layers className="w-12 h-12 text-white/80" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 w-fit">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              onClick={() => setEnvironment(env as Environment)}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                selectedEnvironment === env
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {getEnvironmentLabel(env as Environment)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="总特性数"
            value={stats?.total || 0}
            icon={Layers}
            color="text-blue-600"
            gradient="bg-blue-50"
            subtitle="全部环境"
          />
          <StatCard
            title="全量启用"
            value={envStats?.active || 0}
            icon={CheckCircle2}
            color="text-emerald-600"
            gradient="bg-emerald-50"
            subtitle={getEnvironmentLabel(selectedEnvironment)}
          />
          <StatCard
            title="灰度中"
            value={envStats?.gradual || 0}
            icon={AlertTriangle}
            color="text-amber-600"
            gradient="bg-amber-50"
            subtitle={getEnvironmentLabel(selectedEnvironment)}
          />
          <StatCard
            title="已禁用"
            value={envStats?.disabled || 0}
            icon={Ban}
            color="text-red-600"
            gradient="bg-red-50"
            subtitle={getEnvironmentLabel(selectedEnvironment)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              特性列表
              <span className="ml-2 text-sm font-normal text-slate-500">
                共 {features.length} 个特性
              </span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索特性..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse"
                >
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-6" />
                  <div className="h-2 bg-slate-100 rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : features.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                还没有特性开关
              </h3>
              <p className="text-slate-500 mb-6">
                创建你的第一个特性开关，开始安全发布之旅
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  environment={selectedEnvironment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
