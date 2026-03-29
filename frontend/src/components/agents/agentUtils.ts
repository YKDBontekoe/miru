export const AGENT_PALETTE = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];

export const MOOD_EMOJI: Record<string, string> = {
  Neutral: '😐',
  Optimistic: '😊',
  Happy: '😄',
  Curious: '🤔',
  Focused: '🎯',
  Excited: '🎉',
  Calm: '😌',
  Playful: '😜',
  Serious: '🧐',
  Creative: '🎨',
};

export const TONES = [
  { id: 'casual', label: 'Casual', icon: '💬', hint: 'Friendly, relaxed, conversational' },
  { id: 'formal', label: 'Formal', icon: '🎩', hint: 'Professional, precise, structured' },
  { id: 'playful', label: 'Playful', icon: '🎭', hint: 'Fun, witty, creative with language' },
  { id: 'direct', label: 'Direct', icon: '⚡', hint: 'Blunt, efficient, no fluff' },
  { id: 'analytical', label: 'Analytical', icon: '🔬', hint: 'Data-driven, logical, methodical' },
];

export const SURPRISE_KEYWORDS = [
  'medieval blacksmith who codes',
  'alien linguist',
  'time-traveling historian',
  'underwater archaeologist',
  'space botanist',
  'dream architect',
  'quantum chef',
  'retrowave DJ therapist',
  'sentient library',
  'cyborg philosopher',
];

export const MILESTONES = [
  { threshold: 1, key: 'first_chat', label: 'First words', icon: '👋' },
  { threshold: 10, key: 'first_chat', label: 'Getting to know', icon: '🤝' },
  { threshold: 50, key: 'regular', label: 'Trusted friend', icon: '💙' },
  { threshold: 100, key: 'trusted', label: 'Old companion', icon: '🌟' },
  { threshold: 500, key: 'companion', label: 'Soulbound', icon: '🔮' },
];

export function getAgentColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AGENT_PALETTE[Math.abs(hash) % AGENT_PALETTE.length];
}

export function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] ?? '🤖';
}

export function getTonePrefix(toneId: string): string {
  const map: Record<string, string> = {
    casual: 'Speak casually and conversationally, like talking to a friend. ',
    formal: 'Communicate in a professional and structured manner. ',
    playful: 'Be witty, playful, and creative with language. ',
    direct: 'Be extremely concise and direct — no fluff or pleasantries. ',
    analytical: 'Think and respond analytically, using data and logic. ',
  };
  return map[toneId] ?? '';
}
