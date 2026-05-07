'use client';

import {
  AlertTriangle,
  Thermometer,
  Snowflake,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import {
  useSensorPolling,
  TEMP_MIN,
  TEMP_MAX,
  isOutOfRange,
  POLL_INTERVAL_MS,
  HISTORY_MINUTES,
} from '../_lib/sensor';
import RealtimeChart from '../_components/realtime-chart';
import HistoryTable from '../_components/history-table';
import StatsSummary from '../_components/stats-summary';
import NotificationBell from '../_components/notification-bell';
import AlertToast from '../_components/alert-toast';

export default function DashboardPage() {
  const { readings, isConnected, lastUpdate, isLoading } = useSensorPolling();

  const latest = readings.at(-1) ?? null;
  const previous = readings.at(-2) ?? null;
  const currentTemp = latest?.temperature ?? null;
  const previousTemp = previous?.temperature ?? null;
  const inAlert = currentTemp !== null && isOutOfRange(currentTemp);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        readings={readings}
      />

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CurrentTempCard
              temperature={currentTemp}
              previousTemp={previousTemp}
              inAlert={inAlert}
              loading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <RealtimeChart readings={readings} />
          </div>
        </section>

        <section>
          <StatsSummary readings={readings} />
        </section>

        <section>
          <HistoryTable readings={readings} />
        </section>
      </main>

      <footer className="container mx-auto max-w-7xl px-6 py-6 text-center text-xs text-slate-400">
        เกณฑ์มาตรฐาน {TEMP_MIN.toFixed(1)}°C – {TEMP_MAX.toFixed(1)}°C
        &nbsp;·&nbsp; ข้อมูลย้อนหลัง {HISTORY_MINUTES} นาที
        &nbsp;·&nbsp; อัปเดตทุก {POLL_INTERVAL_MS / 1000} วินาที
      </footer>

      {/* Toast popup ลอยอยู่นอก main flow */}
      <AlertToast readings={readings} />
    </div>
  );
}

function Header({
  isConnected,
  lastUpdate,
  readings,
}: {
  isConnected: boolean;
  lastUpdate: Date | null;
  readings: import('../_lib/sensor').SensorReading[];
}) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md shadow-cyan-500/30 shrink-0">
            <Snowflake className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight truncate">
              ระบบมอนิเตอร์ตู้แช่วัตถุดิบ
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Cold Chain Monitoring · 24/7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {lastUpdate && (
            <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                อัปเดตล่าสุด
              </p>
              <p className="text-sm font-mono text-slate-700">
                {lastUpdate.toLocaleTimeString('en-GB')}
              </p>
            </div>
          )}
          <ConnectionBadge connected={isConnected} />
          <NotificationBell readings={readings} />
        </div>
      </div>
    </header>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
        connected
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Connected
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Disconnected
        </>
      )}
    </div>
  );
}


function CurrentTempCard({
  temperature,
  previousTemp,
  inAlert,
  loading,
}: {
  temperature: number | null;
  previousTemp: number | null;
  inAlert: boolean;
  loading: boolean;
}) {
  const cardColor = inAlert
    ? 'bg-gradient-to-br from-rose-50 to-red-100 border-red-300 shadow-lg shadow-red-500/10'
    : 'bg-white border-slate-200 shadow-sm';

  const trend =
    temperature !== null && previousTemp !== null
      ? temperature - previousTemp
      : null;

  return (
    <div className={`rounded-2xl p-6 h-full border ${cardColor}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Thermometer
            className={`w-4 h-4 ${inAlert ? 'text-red-600' : 'text-cyan-600'}`}
          />
          <p className="text-sm font-medium text-slate-600">อุณหภูมิปัจจุบัน</p>
        </div>
        {inAlert && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            ALERT
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span
          className={`text-7xl font-bold tracking-tight tabular-nums font-mono ${
            inAlert ? 'text-red-600' : 'text-slate-900'
          }`}
        >
          {loading ? '--' : temperature?.toFixed(2) ?? '--'}
        </span>
        <span
          className={`text-2xl font-medium ${
            inAlert ? 'text-red-500' : 'text-slate-400'
          }`}
        >
          °C
        </span>
      </div>

      {trend !== null && (
        <p
          className={`text-xs font-mono mb-5 ${
            Math.abs(trend) < 0.05
              ? 'text-slate-400'
              : trend > 0
                ? 'text-amber-600'
                : 'text-blue-600'
          }`}
        >
          {trend > 0.05 ? '↑' : trend < -0.05 ? '↓' : '→'}{' '}
          {Math.abs(trend).toFixed(2)}°C จากเมื่อกี้
        </p>
      )}

      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
          inAlert
            ? 'bg-red-100 text-red-800'
            : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {inAlert ? (
          <>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">หลุดเกณฑ์! ตรวจสอบตู้แช่ทันที</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">ทำงานปกติ ในเกณฑ์ที่ปลอดภัย</span>
          </>
        )}
      </div>

      <div className="mt-5 pt-5 border-t border-slate-200/70 flex justify-between text-xs">
        <div>
          <p className="text-slate-500 mb-0.5">เกณฑ์ต่ำ</p>
          <p className="font-mono font-semibold text-slate-700">
            {TEMP_MIN.toFixed(1)}°C
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 mb-0.5">เกณฑ์สูง</p>
          <p className="font-mono font-semibold text-slate-700">
            {TEMP_MAX.toFixed(1)}°C
          </p>
        </div>
      </div>
    </div>
  );
}
