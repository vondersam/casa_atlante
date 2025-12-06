import { NextRequest, NextResponse } from 'next/server';
import { Booking, getAvailability, sanitizeBooking, setAvailability } from '@/lib/availability';

type AvailabilityPayload = {
  bookings: Booking[];
};

export async function GET() {
  const availability = await getAvailability();
  return NextResponse.json(
    {
      bookings: availability.bookings,
      updatedAt: availability.updatedAt
    },
    {
      headers: {
        'cache-control': 'no-store'
      }
    }
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as AvailabilityPayload | null;
  if (!payload || !Array.isArray(payload.bookings)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const sanitized = payload.bookings
    .map((booking) => sanitizeBooking(booking))
    .filter((booking): booking is Booking => Boolean(booking));

  if (!sanitized.length) {
    return NextResponse.json({ error: 'No valid bookings provided' }, { status: 400 });
  }

  const updatedAt = await setAvailability(sanitized);

  return NextResponse.json({
    ok: true,
    count: sanitized.length,
    updatedAt
  });
}
