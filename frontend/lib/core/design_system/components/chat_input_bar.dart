import 'package:flutter/material.dart';

import 'package:file_picker/file_picker.dart';
import 'package:miru/core/design_system/design_system.dart';

/// The bottom input bar for composing and sending messages.
///
/// Includes:
/// - A text field for composing the message.
/// - A send button or stop button (during streaming).
///
/// ```dart
/// ChatInputBar(
///   controller: _inputController,
///   focusNode: _inputFocusNode,
///   onSend: _sendMessage,
///   isStreaming: _isStreaming,
///   onStopStreaming: _stopGeneration,
/// )
/// ```
class ChatInputBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final VoidCallback onSend;
  final bool isStreaming;
  final String hintText;
  final VoidCallback? onAttachmentPressed;
  final List<PlatformFile> attachedFiles;
  final void Function(PlatformFile file)? onRemoveAttachment;

  /// Called when the user taps the stop button during streaming.
  final VoidCallback? onStopStreaming;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    this.focusNode,
    this.isStreaming = false,
    this.onStopStreaming,
    this.hintText = 'Message Miru...',
    this.onAttachmentPressed,
    this.attachedFiles = const [],
    this.onRemoveAttachment,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    // Subtle top border instead of full container color
    final containerColor = isDark
        ? AppColors.backgroundDark
        : AppColors.backgroundLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return SafeArea(
      child: Container(
        color: containerColor,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Hairline separator
            Container(height: 1, color: borderColor.withValues(alpha: 0.5)),

            // Attached files preview area
            if (attachedFiles.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(
                  left: AppSpacing.md,
                  right: AppSpacing.md,
                  top: AppSpacing.md,
                ),
                child: SizedBox(
                  height: 60,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: attachedFiles.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      final file = attachedFiles[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.surfaceHighDark
                              : AppColors.surfaceHighLight,
                          borderRadius: BorderRadius.circular(
                            AppSpacing.radiusMd,
                          ),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _getFileIcon(file.name),
                              size: 20,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 100),
                              child: Text(
                                file.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.bodySmall,
                              ),
                            ),
                            if (onRemoveAttachment != null) ...[
                              const SizedBox(width: AppSpacing.xs),
                              Semantics(
                                label: 'Remove attachment ${file.name}',
                                button: true,
                                child: InkWell(
                                  onTap: () => onRemoveAttachment!(file),
                                  child: Tooltip(
                                    message: 'Remove attachment',
                                    child: Icon(
                                      Icons.close_rounded,
                                      size: 16,
                                      color: isDark
                                          ? AppColors.onSurfaceMutedDark
                                          : AppColors.onSurfaceMutedLight,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.md,
                AppSpacing.md,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Attachment button
                  if (onAttachmentPressed != null)
                    Padding(
                      padding: const EdgeInsets.only(
                        right: AppSpacing.sm,
                        bottom: AppSpacing.xs,
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.attach_file_rounded,
                          color: isDark
                              ? AppColors.onSurfaceMutedDark
                              : AppColors.onSurfaceMutedLight,
                        ),
                        onPressed: onAttachmentPressed,
                        tooltip: 'Attach file',
                      ),
                    ),

                  // Text field in a card-like container
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.surfaceHighDark
                            : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusXl,
                        ),
                        border: Border.all(
                          color: borderColor.withValues(alpha: 0.8),
                          width: 1,
                        ),
                        boxShadow: AppShadows.md,
                      ),
                      child: TextField(
                        controller: controller,
                        focusNode: focusNode,
                        maxLines: null,
                        minLines: 1,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => onSend(),
                        style: AppTypography.bodyMedium.copyWith(
                          color: isDark
                              ? AppColors.onSurfaceDark
                              : AppColors.onSurfaceLight,
                        ),
                        decoration: InputDecoration(
                          hintText: hintText,
                          hintStyle: AppTypography.bodyMedium.copyWith(
                            color: isDark
                                ? AppColors.onSurfaceMutedDark
                                : AppColors.onSurfaceMutedLight,
                          ),
                          filled: false,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: AppSpacing.md,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _SendButton(
                    isStreaming: isStreaming,
                    onSend: onSend,
                    onStop: onStopStreaming,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static IconData _getFileIcon(String filename) {
    if (!filename.contains('.')) return Icons.insert_drive_file_rounded;
    final ext = filename.split('.').last.toLowerCase();
    switch (ext) {
      case 'pdf':
        return Icons.picture_as_pdf_rounded;
      case 'doc':
      case 'docx':
        return Icons.description_rounded;
      case 'txt':
        return Icons.text_snippet_rounded;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return Icons.image_rounded;
      default:
        return Icons.insert_drive_file_rounded;
    }
  }
}

// ---------------------------------------------------------------------------
// Send / Stop button
// ---------------------------------------------------------------------------

class _SendButton extends StatelessWidget {
  final bool isStreaming;
  final VoidCallback onSend;
  final VoidCallback? onStop;

  const _SendButton({
    required this.isStreaming,
    required this.onSend,
    required this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    if (isStreaming) {
      return _CircleButton(
        onPressed: onStop,
        tooltip: 'Stop generating',
        backgroundColor: AppColors.error.withValues(alpha: 0.12),
        child: Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: AppColors.error,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
          ),
        ),
      );
    }

    return _CircleButton(
      onPressed: onSend,
      tooltip: 'Send message',
      backgroundColor: AppColors.primary,
      child: const Icon(
        Icons.arrow_upward_rounded,
        color: AppColors.onPrimary,
        size: 20,
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String tooltip;
  final Color backgroundColor;
  final Widget child;

  const _CircleButton({
    required this.onPressed,
    required this.tooltip,
    required this.backgroundColor,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: backgroundColor,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: SizedBox(
            width: AppSpacing.avatarMd,
            height: AppSpacing.avatarMd,
            child: Center(child: child),
          ),
        ),
      ),
    );
  }
}
