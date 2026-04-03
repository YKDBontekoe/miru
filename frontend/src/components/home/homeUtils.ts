import { CalendarEvent } from '@/core/models';

export function getGreeting(hour: number, t: (key: string) => string): string {
  if (hour < 12) return t('home.greeting.morning');
  if (hour < 17) return t('home.greeting.afternoon');
  return t('home.greeting.evening');
}

export function getFirstName(email?: string): string {
  if (!email) return 'there';
  const local = email.split('@')[0] ?? '';
  const name = local.split(/[._0-9]/)[0] ?? local;
  if (!name) return 'there';
  return name[0].toUpperCase() + name.slice(1);
}

export function getInitials(email?: string): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._]/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (local.slice(0, 2) || '?').toUpperCase();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatTimeRange(event: CalendarEvent, locale?: string): string {
  if (event.is_all_day) return 'All day';
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export function relativeTimeFromNow(
  iso: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins === 0) return t('home.time.just_now', { defaultValue: 'just now' });
  if (mins < 60) return t('home.time.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('home.time.hours_ago', { count: hours });
  return t('home.time.days_ago', { count: Math.floor(hours / 24) });
}
