import { getAgentColor as sharedGetAgentColor } from '@/components/agents/agentUtils';

export function getAgentColor(name: string) {
  return sharedGetAgentColor(name);
}

export function formatTime(iso?: string, language: string = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(d);
}
