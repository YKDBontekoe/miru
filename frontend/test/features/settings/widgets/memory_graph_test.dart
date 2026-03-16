import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/memory.dart';
import 'package:miru/features/settings/widgets/memory_graph.dart';

void main() {
  testWidgets('MemoryGraphPainter renders correctly', (
    WidgetTester tester,
  ) async {
    final nodes = [
      GraphNode(id: '1', content: 'Node 1'),
      GraphNode(id: '2', content: 'Node 2'),
    ];
    final List<MemoryEdge> edges = [
      MemoryEdge(source: '1', target: '2', type: 'related'),
    ];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPaint(
            painter: MemoryGraphPainter(
              colors: AppThemeColors.dark(),
              nodes: nodes,
              edges: edges,
            ),
            child: const SizedBox(width: 200, height: 200),
          ),
        ),
      ),
    );

    expect(find.byType(CustomPaint), findsWidgets);
  });
}
