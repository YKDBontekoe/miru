with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

if "final void Function(bool isPositive)? onFeedback;" not in content:
    # Add feedback callback to ChatBubble
    content = content.replace("final VoidCallback? onRetry;", "final VoidCallback? onRetry;\n  final void Function(bool isPositive)? onFeedback;\n  final String? feedback;")
    content = content.replace("required this.onCopy,", "required this.onCopy,\n    this.onFeedback,\n    this.feedback,")

    # Pass it to _ActionRow
    content = content.replace("                      onRetry: isFailed ? onRetry : null,\n                      colors: colors,\n                    ),",
                              "                      onRetry: isFailed ? onRetry : null,\n                      onFeedback: onFeedback,\n                      feedback: feedback,\n                      colors: colors,\n                    ),")

    # Add it to _ActionRow
    old_action_row = """class _ActionRow extends StatelessWidget {
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final AppThemeColors colors;

  const _ActionRow({
    required this.onCopy,
    required this.onRetry,
    required this.colors,
  });"""

    new_action_row = """class _ActionRow extends StatelessWidget {
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final void Function(bool isPositive)? onFeedback;
  final String? feedback;
  final AppThemeColors colors;

  const _ActionRow({
    required this.onCopy,
    required this.onRetry,
    this.onFeedback,
    this.feedback,
    required this.colors,
  });"""

    content = content.replace(old_action_row, new_action_row)

    # Add buttons to _ActionRow UI
    old_build_row = """          if (onRetry != null) ...[
            const SizedBox(width: AppSpacing.xs),
            _ActionChip(
              icon: Icons.refresh_rounded,
              label: 'Retry',
              onPressed: onRetry!,
              color: AppColors.error,
            ),
          ],
        ],
      ),
    );"""

    new_build_row = """          if (onRetry != null) ...[
            const SizedBox(width: AppSpacing.xs),
            _ActionChip(
              icon: Icons.refresh_rounded,
              label: 'Retry',
              onPressed: onRetry!,
              color: AppColors.error,
            ),
          ],
          if (onFeedback != null) ...[
            const SizedBox(width: AppSpacing.xs),
            _ActionChip(
              icon: feedback == 'positive' ? Icons.thumb_up_alt_rounded : Icons.thumb_up_alt_outlined,
              label: 'Helpful',
              onPressed: () => onFeedback!(true),
              color: feedback == 'positive' ? colors.primary : colors.onSurfaceMuted,
            ),
            const SizedBox(width: AppSpacing.xs),
            _ActionChip(
              icon: feedback == 'negative' ? Icons.thumb_down_alt_rounded : Icons.thumb_down_alt_outlined,
              label: 'Unhelpful',
              onPressed: () => onFeedback!(false),
              color: feedback == 'negative' ? colors.primary : colors.onSurfaceMuted,
            ),
          ],
        ],
      ),
    );"""

    content = content.replace(old_build_row, new_build_row)

    with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
        f.write(content)
