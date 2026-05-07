import { NextResponse } from 'next/server';
import { queryRecentReadings } from '@/app/_lib/influx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minutes = Math.min(
      Math.max(parseInt(searchParams.get('minutes') ?? '30'), 1),
      1440, 
    );

    const data = await queryRecentReadings(minutes);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[history] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}
