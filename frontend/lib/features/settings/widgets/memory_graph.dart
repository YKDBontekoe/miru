import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/memory.dart';

class MemoryGraphWidget extends StatelessWidget {
  final List<Memory> memories;
  final List<MemoryEdge> memoryEdges;

  const MemoryGraphWidget({
    super.key,
    required this.memories,
    required this.memoryEdges,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (memories.length == 1) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        child: Text(
          'Only one memory available. More connections appear as Miru learns.',
          style: AppTypography.bodySmall.copyWith(color: colors.onSurfaceMuted),
        ),
      );
    }

    final nodes = memories.map(_GraphNode.fromMemory).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xs,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Container(
        height: 280,
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.md),
          border: Border.all(color: colors.border.withValues(alpha: 0.3)),
        ),
        child: CustomPaint(
          painter: _MemoryGraphPainter(
            colors: colors,
            nodes: nodes,
            edges: memoryEdges,
          ),
          child: const SizedBox.expand(),
        ),
      ),
    );
  }
}

class _GraphNode {
  final String id;
  final String content;

  const _GraphNode({required this.id, required this.content});

  factory _GraphNode.fromMemory(Memory memory) {
    return _GraphNode(id: memory.id, content: memory.content);
  }
}

class _MemoryGraphPainter extends CustomPainter {
  final AppThemeColors colors;
  final List<_GraphNode> nodes;
  final List<MemoryEdge> edges;

  const _MemoryGraphPainter({
    required this.colors,
    required this.nodes,
    required this.edges,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (nodes.isEmpty) {
      return;
    }

    final nodePositions = <String, Offset>{};
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) * 0.33;

    for (var i = 0; i < nodes.length; i++) {
      final angle = (2 * math.pi * i) / nodes.length;
      nodePositions[nodes[i].id] = Offset(
        center.dx + radius * math.cos(angle),
        center.dy + radius * math.sin(angle),
      );
    }

    final edgePaint = Paint()
      ..color = colors.primary.withValues(alpha: 0.32)
      ..strokeWidth = 1.6
      ..style = PaintingStyle.stroke;

    for (final edge in edges) {
      final sourceId = edge.source;
      final targetId = edge.target;

      final sourcePoint = nodePositions[sourceId];
      final targetPoint = nodePositions[targetId];
      if (sourcePoint == null || targetPoint == null) {
        continue;
      }

      canvas.drawLine(sourcePoint, targetPoint, edgePaint);
    }

    for (final node in nodes) {
      final point = nodePositions[node.id];
      if (point == null) {
        continue;
      }

      final nodePaint = Paint()..color = colors.primary;
      canvas.drawCircle(point, 8, nodePaint);

      final label = _shortLabel(node.content);
      final textPainter = TextPainter(
        text: TextSpan(
          text: label,
          style: AppTypography.bodySmall.copyWith(color: colors.onSurface),
        ),
        textDirection: TextDirection.ltr,
        maxLines: 1,
        ellipsis: '...',
      )..layout(maxWidth: 110);

      final dx = point.dx - textPainter.width / 2;
      final dy = point.dy + 12;

      textPainter.paint(canvas, Offset(dx, dy));
    }
  }

  String _shortLabel(String content) {
    final trimmed = content.trim();
    if (trimmed.length <= 18) {
      return trimmed;
    }
    return '${trimmed.substring(0, 18)}...';
  }

  @override
  bool shouldRepaint(covariant _MemoryGraphPainter oldDelegate) {
    return oldDelegate.nodes != nodes || oldDelegate.edges != edges;
  }
}
