import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, History, Plus, Settings } from 'lucide-react';
import { ENVIRONMENTS, getEnvironmentLabel, getEnvironmentColor, type Environment } from '../../shared/types.js';
import { useStore } from '../store/useStore.js';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { selectedEnvironment, setEnvironment } = useStore();

  const navItems = [
    { path: '/', icon: Home, label: '概览' },
    { path: '/features/new', icon: Plus, label: '创建特性' },
    { path: '/history', icon: History, label: '变更历史' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Feature Flags</h1>
              <p className="text-xs text-slate-500">灰度发布管理平台</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">选择环境</p>
          <div className="grid grid-cols-3 gap-1">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env as Environment)}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedEnvironment === env
                    ? `${getEnvironmentColor(env as Environment)} border`
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {getEnvironmentLabel(env as Environment).charAt(0)}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            当前: {getEnvironmentLabel(selectedEnvironment)}
          </p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
            <Settings className="w-4 h-4" />
            <span>系统设置</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {navItems.find((n) => isActive(n.path))?.label || '特性开关管理'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/features/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新建特性
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
