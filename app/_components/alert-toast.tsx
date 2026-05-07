'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ArrowUp, ArrowDown, X } from 'lucide-react';
import {
  type SensorReading,
  isHighAlert,
  isOutOfRange,
  getDeviation,
  formatDateTimeTH,
} from '../_lib/sensor';

const TOAST_AUTO_DISMISS_MS = 8000; 

export default function AlertToast({
  readings,
}: {
  readings: SensorReading[];
}) {
  const [currentToast, setCurrentToast] = useState<SensorReading | null>(null);
  const initialized = useRef(false);
  const seenInSession = useRef<Set<number>>(new Set());
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const alerts = readings.filter((r) => isOutOfRange(r.temperature));

    if (!initialized.current) {
      alerts.forEach((a) => seenInSession.current.add(a.id));
      initialized.current = true;
      return;
    }

    const newAlerts = alerts.filter((a) => !seenInSession.current.has(a.id));
    if (newAlerts.length === 0) return;

    newAlerts.forEach((a) => seenInSession.current.add(a.id));

    const latest = newAlerts[newAlerts.length - 1];
    setCurrentToast(latest);

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setCurrentToast(null);
    }, TOAST_AUTO_DISMISS_MS);
  }, [readings]);

  if (!currentToast) return null;

  const high = isHighAlert(currentToast.temperature);
  const dev = getDeviation(currentToast.temperature);

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-slide-in-right pointer-events-auto"
      role="alert"
    >
      <div
        className={`bg-white rounded-2xl border-2 shadow-2xl overflow-hidden w-96 max-w-[calc(100vw-2rem)] ${
          high
            ? 'border-red-400 shadow-red-500/30'
            : 'border-blue-400 shadow-blue-500/30'
        }`}
      >
        {/* Top strip — colored bar */}
        <div
          className={`h-1.5 ${
            high
              ? 'bg-gradient-to-r from-red-500 to-rose-500'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}
        />

        <div className="p-4 flex gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              high ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${high ? 'text-red-600' : 'text-blue-600'}`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm font-bold ${
                  high ? 'text-red-700' : 'text-blue-700'
                }`}
              >
                ⚠️ อุณหภูมิ{high ? 'สูงเกินเกณฑ์' : 'ต่ำกว่าเกณฑ์'}!
              </p>
              <button
                onClick={() => setCurrentToast(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded -mt-1 -mr-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  high ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {currentToast.temperature.toFixed(2)}
              </span>
              <span
                className={`text-sm ${
                  high ? 'text-red-500' : 'text-blue-500'
                }`}
              >
                °C
              </span>
              <span
                className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  high
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {high ? (
                  <>
                    <ArrowUp className="w-3 h-3" />+{Math.abs(dev).toFixed(2)}°C
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3" />−{Math.abs(dev).toFixed(2)}
                    °C
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 font-mono">
              {formatDateTimeTH(currentToast.timestamp)}
            </p>

            <p
              className={`text-xs mt-2 font-medium ${
                high ? 'text-red-700' : 'text-blue-700'
              }`}
            >
              ตรวจสอบตู้แช่ทันที!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
