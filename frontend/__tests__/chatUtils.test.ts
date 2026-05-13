import { formatTime, getAgentColor } from '../src/utils/chatUtils';

describe('chatUtils', () => {
  describe('formatTime', () => {
    it('returns empty string if no iso string provided', () => {
      expect(formatTime()).toBe('');
    });

    it('returns formatted time', () => {
      expect(formatTime('2026-05-13T10:00:00Z', 'en')).toBe('10:00 AM');
    });

    it('returns fallback string if invalid iso', () => {
      expect(formatTime('invalid')).toBe('invalid');
    });
  });

  describe('getAgentColor', () => {
    it('returns a color for a given name', () => {
      expect(typeof getAgentColor('Miru')).toBe('string');
    });
  });
});
