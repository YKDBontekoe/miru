import 'package:flutter/material.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/memory.dart';
import 'package:miru/core/utils/date_utils.dart';
import 'package:miru/features/settings/widgets/memory_list_item.dart';
import 'package:miru/features/settings/widgets/memory_graph_view.dart';
import 'dart:developer' as developer;

class MemoryBrowser extends StatefulWidget {
  const MemoryBrowser({super.key});

  @override
  State<MemoryBrowser> createState() => _MemoryBrowserState();
}

class _MemoryBrowserState extends State<MemoryBrowser> {
  List<Memory> _memories = [];
  List<MemoryCollection> _collections = [];
  MemoryGraph? _graph;
  bool _loading = true;
  String _searchQuery = '';
  MemoryCollection? _selectedCollection;
  int _currentViewIndex = 0; // 0: List, 1: Collections, 2: Timeline, 3: Graph

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final futures = await Future.wait([
        ApiService.instance.getMemories(
          query: _searchQuery,
          collectionId: _selectedCollection?.id,
        ),
        ApiService.instance.getCollections(),
        ApiService.instance.getMemoryGraph(),
      ]);
      setState(() {
        _memories = futures[0] as List<Memory>;
        _collections = futures[1] as List<MemoryCollection>;
        _graph = futures[2] as MemoryGraph;
      });
    } catch (e, st) {
      developer.log('Failed to load memory data', error: e, stackTrace: st);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load memories')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteMemory(Memory memory) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Forget memory?'),
        content: Text('Should I forget this detail?\n\n"${memory.content}"'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Forget'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ApiService.instance.deleteMemory(memory.id);
      setState(() {
        _memories.removeWhere((m) => m.id == memory.id);
      });
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Memory forgotten')));
      }
    } catch (e, st) {
      developer.log('Failed to delete memory', error: e, stackTrace: st);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to forget memory')),
        );
      }
    }
  }

  Future<void> _exportMemories() async {
    try {
      // In a real app we'd trigger a download. For now, we just call the API.
      await ApiService.instance.exportMemories('json');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Memories exported successfully')),
        );
      }
    } catch (e, st) {
      developer.log('Failed to export memories', error: e, stackTrace: st);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to export memories')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildToolbar(),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(AppSpacing.xl),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          _buildContent(),
      ],
    );
  }

  Widget _buildToolbar() {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search memories...',
                    prefixIcon: const Icon(Icons.search_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: 0,
                    ),
                  ),
                  onSubmitted: (val) {
                    setState(() => _searchQuery = val);
                    _loadData();
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              IconButton.filledTonal(
                icon: const Icon(Icons.download_rounded),
                tooltip: 'Export Memories',
                onPressed: _exportMemories,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(
                value: 0,
                icon: Icon(Icons.list_rounded),
                label: Text('List'),
              ),
              ButtonSegment(
                value: 1,
                icon: Icon(Icons.folder_rounded),
                label: Text('Folders'),
              ),
              ButtonSegment(
                value: 2,
                icon: Icon(Icons.timeline_rounded),
                label: Text('Timeline'),
              ),
              ButtonSegment(
                value: 3,
                icon: Icon(Icons.hub_rounded),
                label: Text('Graph'),
              ),
            ],
            selected: {_currentViewIndex},
            onSelectionChanged: (set) {
              setState(() => _currentViewIndex = set.first);
            },
            style: ButtonStyle(
              foregroundColor: WidgetStatePropertyAll(colors.onSurface),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_memories.isEmpty && _searchQuery.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Text(
          'No memories stored yet. As you talk to Miru, she will learn more about you.',
          textAlign: TextAlign.center,
          style: AppTypography.bodyMedium.copyWith(
            color: context.colors.onSurfaceMuted,
          ),
        ),
      );
    }

    switch (_currentViewIndex) {
      case 0:
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _memories.length,
          itemBuilder: (ctx, i) => MemoryListItem(
            memory: _memories[i],
            onDelete: () => _deleteMemory(_memories[i]),
          ),
        );
      case 1:
        return _buildCollectionsView();
      case 2:
        return _buildTimelineView();
      case 3:
        if (_graph != null) {
          return MemoryGraphView(
            memories: _memories,
            memoryEdges: _graph!.edges,
          );
        }
        return const Center(child: Text('Graph data unavailable'));
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildCollectionsView() {
    // Simplified collections view with drag and drop
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Collections', style: AppTypography.labelLarge),
          const SizedBox(height: AppSpacing.md),
          if (_collections.isEmpty) const Text('No collections created yet.'),
          ..._collections.map((c) => _buildCollectionTarget(c)),
          const SizedBox(height: AppSpacing.xl),
          Text('Uncategorized Memories', style: AppTypography.labelLarge),
          const SizedBox(height: AppSpacing.md),
          ..._memories
              .where((m) => m.collectionId == null)
              .map((m) => _buildDraggableMemory(m)),
        ],
      ),
    );
  }

  Widget _buildCollectionTarget(MemoryCollection collection) {
    final collectionMemories = _memories
        .where((m) => m.collectionId == collection.id)
        .toList();
    final colors = context.colors;

    return DragTarget<Memory>(
      onAcceptWithDetails: (details) async {
        final memory = details.data;
        try {
          await ApiService.instance.updateMemory(
            memory.id,
            collectionId: collection.id,
          );
          _loadData();
        } catch (e) {
          developer.log('Failed to update memory collection', error: e);
        }
      },
      builder: (context, candidateData, rejectedData) {
        return ExpansionTile(
          leading: Icon(
            candidateData.isNotEmpty
                ? Icons.folder_open_rounded
                : Icons.folder_rounded,
            color: colors.primary,
          ),
          title: Text(collection.name),
          subtitle: Text('${collectionMemories.length} memories'),
          children: collectionMemories
              .map((m) => _buildDraggableMemory(m))
              .toList(),
        );
      },
    );
  }

  Widget _buildDraggableMemory(Memory memory) {
    return LongPressDraggable<Memory>(
      data: memory,
      feedback: Material(
        elevation: 4,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(16),
          width: 300,
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(memory.content),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.5,
        child: MemoryListItem(
          memory: memory,
          onDelete: () => _deleteMemory(memory),
        ),
      ),
      child: MemoryListItem(
        memory: memory,
        onDelete: () => _deleteMemory(memory),
      ),
    );
  }

  Widget _buildTimelineView() {
    // Sort memories chronologically for timeline
    final sorted = List<Memory>.from(_memories)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sorted.length,
      itemBuilder: (ctx, i) {
        final m = sorted[i];
        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xs,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 80,
                child: Text(
                  AppDateUtils.formatDate(m.createdAt),
                  style: AppTypography.labelSmall.copyWith(
                    color: context.colors.onSurfaceMuted,
                  ),
                ),
              ),
              Container(
                width: 2,
                height: 40,
                color: context.colors.surfaceHigh,
                margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              ),
              Expanded(child: Text(m.content, style: AppTypography.bodyMedium)),
            ],
          ),
        );
      },
    );
  }
}
