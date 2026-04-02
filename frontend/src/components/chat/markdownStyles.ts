import { theme } from '../../core/theme';

export const getMarkdownStyles = (isDark: boolean, isFailed: boolean, agentTextColor: string) => ({
  body: {
    color: isFailed ? theme.colors.status.error : agentTextColor,
    ...theme.typography.body,
    margin: 0,
  },
  paragraph: { marginTop: 0, marginBottom: 0 },
  code_inline: {
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highestLight,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: theme.spacing.xs,
    color: agentTextColor,
    ...theme.typography.bodySm,
  },
  fence: {
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.highLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  code_block: {
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.highLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    color: agentTextColor,
    ...theme.typography.bodySm,
  },
  strong: { fontWeight: '700' as const },
  em: { fontStyle: 'italic' as const },
});
