'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SensorReading {
  id: number;
  timestamp: string;
  temperature: number;
}


export const TEMP_MIN = 2.0;
export const TEMP_MAX = 8.0;
export const POLL_INTERVAL_MS = 5_000;
export const HISTORY_MINUTES = 30; // กราฟแสดงย้อนหลัง 30 นาที

const HISTORY_API = '/api/sensor/history';


export const isHighAlert = (t: number) => t > TEMP_MAX;
export const isLowAlert = (t: number) => t < TEMP_MIN;
export const isOutOfRange = (t: number) => isHighAlert(t) || isLowAlert(t);

export const getDeviation = (t: number): number => {
  if (t > TEMP_MAX) return t - TEMP_MAX;
  if (t < TEMP_MIN) return t - TEMP_MIN;
  return 0;
};

export interface SensorPollingState {
  readings: SensorReading[];
  isConnected: boolean;
  lastUpdate: Date | null;
  isLoading: boolean;
}

export function useSensorPolling(): SensorPollingState {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${HISTORY_API}?minutes=${HISTORY_MINUTES}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: SensorReading[] = await res.json();
      setReadings(data);
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[useSensorPolling]', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { readings, isConnected, lastUpdate, isLoading };
}

export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const formatDateTimeTH = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const timeAgoTH = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 10) return 'เมื่อสักครู่';
  if (seconds < 60) return `${seconds} วินาทีก่อน`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีก่อน`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงก่อน`;
  return `${Math.floor(hours / 24)} วันก่อน`;
};


export interface SensorStats {
  avg: number;
  min: number;
  max: number;
  alertCount: number;
  totalReadings: number;
  uptimePercent: number;
}

export function computeStats(readings: SensorReading[]): SensorStats {
  if (readings.length === 0) {
    return { avg: 0, min: 0, max: 0, alertCount: 0, totalReadings: 0, uptimePercent: 100 };
  }
  const temps = readings.map((r) => r.temperature);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const alertCount = readings.filter((r) => isOutOfRange(r.temperature)).length;
  const inRange = readings.length - alertCount;
  return {
    avg,
    min: Math.min(...temps),
    max: Math.max(...temps),
    alertCount,
    totalReadings: readings.length,
    uptimePercent: (inRange / readings.length) * 100,
  };
}
