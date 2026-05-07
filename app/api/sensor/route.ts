import { NextResponse } from 'next/server';
import { writeReading } from '@/app/_lib/influx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body.temperature !== 'number' || !isFinite(body.temperature)) {
      return NextResponse.json(
        { error: 'temperature must be a finite number' },
        { status: 400 },
      );
    }

    if (body.temperature < -50 || body.temperature > 100) {
      return NextResponse.json(
        { error: 'temperature out of plausible range' },
        { status: 400 },
      );
    }

    await writeReading(body.temperature);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/sensor] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}
