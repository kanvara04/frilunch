'use client';

import {
  History,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Database,
} from 'lucide-react';
import {
  type SensorReading,
  TEMP_MIN,
  TEMP_MAX,
  isHighAlert,
  isLowAlert,
  isOutOfRange,
  getDeviation,
  formatDateTimeTH,
  timeAgoTH,
} from '../_lib/sensor';

export default function HistoryTable({
  readings,
}: {
  readings: SensorReading[];
}) {
  const all = readings.slice().reverse();

  const alertCount = readings.filter((r) => isOutOfRange(r.temperature)).length;
  const normalCount = readings.length - alertCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-50">
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              ประวัติอุณหภูมิทั้งหมด
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลจากเซ็นเซอร์ทุกรายการ ใหม่สุดอยู่บนสุด
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Chip
            tone="emerald"
            icon={<CheckCircle2 className="w-3 h-3" />}
            label={`ปกติ ${normalCount}`}
          />
          {alertCount > 0 && (
            <Chip
              tone="red"
              icon={<ArrowUp className="w-3 h-3" />}
              label={`หลุดเกณฑ์ ${alertCount}`}
            />
          )}
          <Chip
            tone="slate"
            icon={<History className="w-3 h-3" />}
            label={`รวม ${readings.length}`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 sticky top-0 z-[1] backdrop-blur">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3 font-medium w-16">#</th>
              <th className="px-6 py-3 font-medium">วันที่ - เวลา</th>
              <th className="px-6 py-3 font-medium">สถานะ</th>
              <th className="px-6 py-3 font-medium text-right">อุณหภูมิ</th>
              <th className="px-6 py-3 font-medium text-right">ส่วนต่าง</th>
              <th className="px-6 py-3 font-medium text-right">เวลาที่ผ่านมา</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {all.map((r, i) => {
              const high = isHighAlert(r.temperature);
              const low = isLowAlert(r.temperature);
              const alert = high || low;
              const dev = getDeviation(r.temperature);
              const seq = all.length - i;

              const rowBg = alert
                ? 'bg-red-50/40 hover:bg-red-50/70'
                : 'hover:bg-slate-50';

              return (
                <tr key={r.id} className={`transition-colors ${rowBg}`}>
                  <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                    #{String(seq).padStart(3, '0')}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-800">
                    {formatDateTimeTH(r.timestamp)}
                  </td>
                  <td className="px-6 py-3">
                    {high ? (
                      <Badge tone="red" icon={<ArrowUp className="w-3 h-3" />}>
                        HIGH
                      </Badge>
                    ) : low ? (
                      <Badge
                        tone="blue"
                        icon={<ArrowDown className="w-3 h-3" />}
                      >
                        LOW
                      </Badge>
                    ) : (
                      <Badge
                        tone="emerald"
                        icon={<CheckCircle2 className="w-3 h-3" />}
                      >
                        ปกติ
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        high
                          ? 'text-red-600'
                          : low
                            ? 'text-blue-600'
                            : 'text-slate-800'
                      }`}
                    >
                      {r.temperature.toFixed(2)}°C
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {alert ? (
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          high ? 'text-red-500' : 'text-blue-500'
                        }`}
                      >
                        {dev > 0 ? '+' : '−'}
                        {Math.abs(dev).toFixed(2)}°C
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-slate-500">
                    {timeAgoTH(r.timestamp)}
                  </td>
                </tr>
              );
            })}

            {all.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">ยังไม่มีข้อมูล</p>
                  <p className="text-xs mt-1">รอเซ็นเซอร์ส่งข้อมูลเข้ามา</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {all.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          เกณฑ์มาตรฐาน {TEMP_MIN.toFixed(1)}°C – {TEMP_MAX.toFixed(1)}°C
          &nbsp;·&nbsp; เลื่อนเพื่อดูเพิ่มเติม
        </div>
      )}
    </div>
  );
}


function Chip({
  tone,
  icon,
  label,
}: {
  tone: 'red' | 'emerald' | 'slate';
  icon: React.ReactNode;
  label: string;
}) {
  const tones = {
    red: 'bg-red-50 text-red-700 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${tones}`}
    >
      {icon}
      {label}
    </span>
  );
}

function Badge({
  tone,
  icon,
  children,
}: {
  tone: 'red' | 'blue' | 'emerald';
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    red: 'bg-red-50 text-red-700 border-red-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${tones}`}
    >
      {icon}
      {children}
    </span>
  );
}
