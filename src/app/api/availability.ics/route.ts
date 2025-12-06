import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/availability';

function formatDate(date: string) {
  return date.replace(/-/g, '');
}

function formatTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET() {
  const { bookings, updatedAt } = await getAvailability();
  const now = new Date();
  const stamp = formatTimestamp(now);
  const lastModified = updatedAt ? formatTimestamp(new Date(updatedAt)) : stamp;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Casa Atlante//Availability//EN',
    'X-WR-CALNAME:Casa Atlante Availability',
    'X-WR-TIMEZONE:UTC',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  bookings.forEach((booking, index) => {
    const summaryPrefix = booking.source ? `[${booking.source}] ` : '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${booking.start}-${booking.end}-${index}@casa-atlante`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${formatDate(booking.start)}`,
      `DTEND;VALUE=DATE:${formatDate(booking.end)}`,
      `SUMMARY:${summaryPrefix}Booked`,
      `LAST-MODIFIED:${lastModified}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const body = lines.join('\r\n') + '\r\n';

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
