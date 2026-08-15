const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatCompactDate(value: string) {
  const match = ISO_DATE.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
