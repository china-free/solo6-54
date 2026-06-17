import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  gradient: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  gradient,
  subtitle
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}
