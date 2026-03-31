export function formatMessageDate(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  if (d.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
}
