import { NextRequest, NextResponse } from 'next/server';
import { syncAvailabilityFromSources } from '@/lib/availability-sync';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const vercelCronHeader = req.headers.get('x-vercel-cron');

  const isAuthorized =
    Boolean(vercelCronHeader) || (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAvailabilityFromSources();
    return NextResponse.json({
      ok: true,
      triggeredBy: vercelCronHeader ? 'vercel-cron' : 'manual',
      result
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Sync failed', message: (err as Error).message ?? 'Unknown error' },
      { status: 502 }
    );
  }
}
