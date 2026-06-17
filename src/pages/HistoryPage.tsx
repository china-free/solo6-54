import { useEffect, useState } from 'react';
import { Clock, User, Plus, Edit3, X, Filter } from 'lucide-react';
import Layout from '../components/Layout.js';
import { useStore } from '../store/useStore.js';
import {
  getEnvironmentLabel,
  getEnvironmentColor,
  type Environment
} from '../../shared/types.js';

export default function HistoryPage() {
  const { fetchHistory, history, loading } = useStore();
  const [filterOperation, setFilterOperation] = useState<string>('');
  const [filterEnvironment, setFilterEnvironment] = useState<Environment | ''>('');

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = history.filter((record) => {
    if (filterOperation && record.operation !== filterOperation) return false;
    if (filterEnvironment && record.environment !== filterEnvironment) return false;
    return true;
  });

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'update':
        return <Edit3 className="w-4 h-4" />;
      case 'delete':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'create':
        return '创建';
      case 'update':
        return '更新';
      case 'delete':
        return '删除';
      default:
        return operation;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">变更历史</h1>
          <p className="text-sm text-slate-500">查看所有特性开关的操作记录</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">筛选：</span>
          </div>
          <select
            value={filterOperation}
            onChange={(e) => setFilterOperation(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">全部操作</option>
            <option value="create">创建</option>
            <option value="update">更新</option>
            <option value="delete">删除</option>
          </select>
          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value as Environment | '')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">全部环境</option>
            <option value="development">开发环境</option>
            <option value="testing">测试环境</option>
            <option value="production">生产环境</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-500">加载中...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-16 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无变更记录</h3>
              <p className="text-slate-500">
                {filterOperation || filterEnvironment
                  ? '没有符合筛选条件的记录'
                  : '还没有任何操作记录'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHistory.map((record) => (
                <div key={record.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      record.operation === 'create' ? 'bg-green-100 text-green-600' :
                      record.operation === 'update' ? 'bg-blue-100 text-blue-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {getOperationIcon(record.operation)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-slate-900">
                          {record.featureName}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          record.operation === 'create' ? 'bg-green-100 text-green-700' :
                          record.operation === 'update' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getOperationLabel(record.operation)}
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
                        <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono max-h-32 overflow-y-auto">
                          {Object.entries(record.changes).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 py-0.5">
                              <span className="text-slate-500 w-56 flex-shrink-0 truncate">{key}:</span>
                              <span className="text-red-500">
                                {value.old !== null && value.old !== undefined
                                  ? typeof value.old === 'object'
                                    ? JSON.stringify(value.old)
                                    : String(value.old)
                                  : '-'}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className="text-green-600">
                                {value.new !== null && value.new !== undefined
                                  ? typeof value.new === 'object'
                                    ? JSON.stringify(value.new)
                                    : String(value.new)
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
      </div>
    </Layout>
  );
}
