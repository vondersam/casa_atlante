import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Missing host header' }, { status: 400 });
  }

  const protocol = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const target = `${protocol}://${host}/api/availability/sync`;

  const syncRes = await fetch(target, {
    method: 'POST',
    headers: {
      ...(process.env.WEBHOOK_SECRET ? { 'x-webhook-secret': process.env.WEBHOOK_SECRET } : {})
    },
    cache: 'no-store'
  });

  const bodyText = await syncRes.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = bodyText;
  }

  if (!syncRes.ok) {
    return NextResponse.json(
      {
        error: 'Sync failed',
        status: syncRes.status,
        response: parsed
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    forwardedTo: target,
    response: parsed
  });
}
