'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, ArrowUp, ArrowDown, X, BellOff } from 'lucide-react';
import {
  type SensorReading,
  isHighAlert,
  isOutOfRange,
  getDeviation,
  formatDateTimeTH,
  timeAgoTH,
} from '../_lib/sensor';

const SEEN_IDS_STORAGE_KEY = 'frilunch:seenAlertIds:v1';
const MAX_STORED_IDS = 500; 
export default function NotificationBell({
  readings,
}: {
  readings: SensorReading[];
}) {
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch {
      // ignore — localStorage might be disabled
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const allAlerts = readings
    .filter((r) => isOutOfRange(r.temperature))
    .slice()
    .reverse();

  const unseenCount = hydrated
    ? allAlerts.filter((a) => !seenIds.has(a.id)).length
    : 0;

  const markAllAsSeen = () => {
    const allIds = allAlerts.map((a) => a.id);
    const merged = new Set<number>([...seenIds, ...allIds]);


    const arr = Array.from(merged).sort((a, b) => b - a).slice(0, MAX_STORED_IDS);
    const trimmed = new Set(arr);

    setSeenIds(trimmed);
    try {
      localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
  };

  const togglePanel = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(markAllAsSeen, 600);
    } else {
      setIsOpen(false);
    }
  };

  const hasUnseen = unseenCount > 0;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={togglePanel}
        className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
          hasUnseen
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-white border-slate-200 hover:bg-slate-50'
        }`}
        aria-label={`Notifications${hasUnseen ? ` (${unseenCount} unread)` : ''}`}
      >
        <Bell
          className={`w-5 h-5 ${hasUnseen ? 'text-red-600' : 'text-slate-700'}`}
        />
        {hasUnseen && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center px-1.5 ring-2 ring-white animate-badge-pulse">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-br from-slate-50 to-white">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                การแจ้งเตือน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {allAlerts.length === 0
                  ? 'ยังไม่มีเหตุการณ์'
                  : `${allAlerts.length} เหตุการณ์อุณหภูมิหลุดเกณฑ์`}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {allAlerts.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-slate-100">
                {allAlerts.map((alert) => (
                  <NotificationItem
                    key={alert.id}
                    alert={alert}
                    isUnread={!seenIds.has(alert.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  alert,
  isUnread,
}: {
  alert: SensorReading;
  isUnread: boolean;
}) {
  const high = isHighAlert(alert.temperature);
  const dev = getDeviation(alert.temperature);

  return (
    <li
      className={`px-4 py-3 flex gap-3 transition-colors ${
        isUnread ? 'bg-red-50/50' : 'hover:bg-slate-50'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
          high ? 'bg-red-100' : 'bg-blue-100'
        }`}
      >
        {high ? (
          <ArrowUp className="w-4 h-4 text-red-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-semibold ${
              high ? 'text-red-700' : 'text-blue-700'
            }`}
          >
            อุณหภูมิ{high ? 'สูงเกินเกณฑ์' : 'ต่ำกว่าเกณฑ์'}
          </p>
          {isUnread && (
            <span
              className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"
              aria-label="unread"
            />
          )}
        </div>
        <p className="text-sm text-slate-700 mt-0.5 font-mono">
          {alert.temperature.toFixed(2)}°C
          <span
            className={`ml-2 text-xs ${
              high ? 'text-red-500' : 'text-blue-500'
            }`}
          >
            ({dev > 0 ? '+' : '−'}
            {Math.abs(dev).toFixed(2)}°C)
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {timeAgoTH(alert.timestamp)}
        </p>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
          {formatDateTimeTH(alert.timestamp)}
        </p>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="px-4 py-12 text-center">
      <BellOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-700">ยังไม่มีการแจ้งเตือน</p>
      <p className="text-xs text-slate-500 mt-1">
        ตู้แช่ทำงานในเกณฑ์ปกติ
      </p>
    </div>
  );
}
