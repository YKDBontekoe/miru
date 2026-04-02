export function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function formatTime(iso?: string, language: string = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(d);
}
