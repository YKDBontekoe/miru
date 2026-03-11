import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';
import '../../models/message_status.dart';

class StreamingBubble extends StatelessWidget {
  final String agentName;
  final String text;

  const StreamingBubble(
      {super.key, required this.agentName, required this.text});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(
              left: AppSpacing.xs,
              bottom: AppSpacing.xxs,
            ),
            child: Text(
              agentName,
              style: AppTypography.labelSmall.copyWith(
                color: colors.onSurfaceMuted,
              ),
            ),
          ),
          ChatBubble(
            text: text,
            isUser: false,
            agentName: agentName,
            status: MessageStatus.streaming,
          ),
        ],
      ),
    );
  }
}
