/**
 * Generates a consistent color hex code based on a given name string.
 * Uses a predefined palette and a simple string hashing algorithm.
 *
 * @param name - The name string to hash.
 * @returns A hex color string from the predefined palette.
 */
export function getAgentColor(name: string): string {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
