import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  subtitle?: string;
  trend?: 'success' | 'warning' | 'error' | 'neutral';
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  gradient,
  subtitle,
  trend = 'neutral'
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'success':
        return <TrendingUp className="w-3 h-3 text-emerald-600" />;
      case 'warning':
        return <Minus className="w-3 h-3 text-amber-600" />;
      case 'error':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {getTrendIcon()}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </div>
      <div className={`h-1 w-full ${getTrendColor()}`} />
    </div>
  );
}
