'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity } from 'lucide-react';
import {
  type SensorReading,
  TEMP_MIN,
  TEMP_MAX,
  isOutOfRange,
  formatClock,
} from '../_lib/sensor';

export default function RealtimeChart({ readings }: { readings: SensorReading[] }) {
  const data = readings.map((r) => ({
    time: formatClock(r.timestamp),
    temperature: r.temperature,
    isAlert: isOutOfRange(r.temperature),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-semibold text-slate-700">
            กราฟอุณหภูมิตามเวลา
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="text-slate-500 font-medium tracking-wider uppercase">
            Live
          </span>
        </div>
      </div>

      <div className="h-72 -ml-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={40}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.min(0, Math.floor(dataMin - 1)),
                (dataMax: number) => Math.max(12, Math.ceil(dataMax + 1)),
              ]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}°`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(v: number) => [`${v.toFixed(2)}°C`, 'อุณหภูมิ']}
            />
            <ReferenceLine
              y={TEMP_MAX}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Max ${TEMP_MAX}°`, fontSize: 10, fill: '#ef4444', position: 'right' }}
            />
            <ReferenceLine
              y={TEMP_MIN}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              label={{ value: `Min ${TEMP_MIN}°`, fontSize: 10, fill: '#3b82f6', position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#0891b2"
              strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: { isAlert: boolean }; index?: number }) => {
                const { cx, cy, payload, index } = props;
                if (cx == null || cy == null) return <g key={index} />;
                if (payload?.isAlert) {
                  return <circle key={index} cx={cx} cy={cy} r={4} fill="#dc2626" stroke="white" strokeWidth={1.5} />;
                }
                return <circle key={index} cx={cx} cy={cy} r={2.5} fill="#0891b2" />;
              }}
              activeDot={{ r: 6, fill: '#0891b2', stroke: 'white', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
