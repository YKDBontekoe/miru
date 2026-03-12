import 'package:flutter/material.dart';
import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/tokens/durations.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';

/// Animated typing indicator with three bouncing dots.
///
/// Used inside [ChatBubble] when the assistant is composing a response.
class TypingIndicator extends StatelessWidget {
  final String? agentName;
  const TypingIndicator({super.key, this.agentName});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Padding(
          padding: EdgeInsets.only(right: i < 2 ? AppSpacing.xs : 0),
          child: _BouncingDot(
            agentName: agentName,
            delay: Duration(
              milliseconds: i * AppDurations.typingStagger.inMilliseconds,
            ),
          ),
        );
      }),
    );
  }
}

/// Internal animated dot used by [TypingIndicator].
class _BouncingDot extends StatefulWidget {
  final Duration delay;
  final String? agentName;

  const _BouncingDot({required this.delay, this.agentName});

  @override
  State<_BouncingDot> createState() => _BouncingDotState();
}

class _BouncingDotState extends State<_BouncingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppDurations.typingBounce,
    );
    _animation = Tween<double>(begin: 0, end: -6).animate(
      CurvedAnimation(parent: _controller, curve: AppDurations.bounceCurve),
    );
    Future.delayed(widget.delay, () {
      if (mounted) _controller.repeat(reverse: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    Color dotColor = context.colors.onSurfaceMuted;
    if (widget.agentName != null && widget.agentName!.isNotEmpty) {
      final baseColors = [
        Colors.blue,
        Colors.teal,
        Colors.red,
        Colors.indigo,
        Colors.deepPurple,
        Colors.orange
      ];
      dotColor =
          baseColors[widget.agentName!.hashCode.abs() % baseColors.length];
    }

    return AnimatedBuilder(
      animation: _animation,
      builder: (_, __) => Transform.translate(
        offset: Offset(0, _animation.value),
        child: Container(
          width: AppSpacing.typingDotSize,
          height: AppSpacing.typingDotSize,
          decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
