'use client';

import { TrendingUp, TrendingDown, Activity, ShieldAlert, ShieldCheck } from 'lucide-react';
import { type SensorReading, computeStats } from '../_lib/sensor';

export default function StatsSummary({ readings }: { readings: SensorReading[] }) {
  const stats = computeStats(readings);
  const isHealthy = stats.uptimePercent >= 95;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        icon={<Activity className="w-4 h-4" />}
        label="ค่าเฉลี่ย"
        value={`${stats.avg.toFixed(2)}°C`}
        tone="cyan"
      />
      <StatCard
        icon={<TrendingDown className="w-4 h-4" />}
        label="ต่ำสุด"
        value={`${stats.min.toFixed(2)}°C`}
        tone="blue"
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="สูงสุด"
        value={`${stats.max.toFixed(2)}°C`}
        tone="amber"
      />
      <StatCard
        icon={<ShieldAlert className="w-4 h-4" />}
        label="หลุดเกณฑ์"
        value={`${stats.alertCount} ครั้ง`}
        tone={stats.alertCount > 0 ? 'red' : 'slate'}
      />
      <StatCard
        icon={isHealthy ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
        label="ความเสถียร"
        value={`${stats.uptimePercent.toFixed(1)}%`}
        tone={isHealthy ? 'emerald' : 'red'}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'cyan' | 'blue' | 'amber' | 'red' | 'emerald' | 'slate';
}) {
  const tones = {
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${tones}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80 mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums">{value}</div>
    </div>
  );
}
