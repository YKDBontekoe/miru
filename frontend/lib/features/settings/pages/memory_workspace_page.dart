import 'dart:developer' as developer;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/memory_workspace.dart';
import 'package:miru/core/utils/date_utils.dart';

class MemoryWorkspacePage extends StatefulWidget {
  const MemoryWorkspacePage({super.key});

  @override
  State<MemoryWorkspacePage> createState() => _MemoryWorkspacePageState();
}

class _MemoryWorkspacePageState extends State<MemoryWorkspacePage> {
  final TextEditingController _searchController = TextEditingController();
  final Set<String> _selectedForMerge = <String>{};

  List<MemoryCollection> _collections = <MemoryCollection>[];
  List<WorkspaceMemory> _memories = <WorkspaceMemory>[];
  List<TimelineBucket> _timeline = <TimelineBucket>[];
  List<WorkspaceMemory> _onThisDay = <WorkspaceMemory>[];

  int _workspaceRequestId = 0;
  String? _selectedCollectionId;
  DateTimeRange? _dateRange;
  bool _loading = true;
  bool _timelineMode = false;

  @override
  void initState() {
    super.initState();
    _loadWorkspace();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadWorkspace() async {
    final reqId = ++_workspaceRequestId;
    setState(() => _loading = true);
    try {
      final collections = await ApiService.instance.getMemoryCollections();
      if (reqId != _workspaceRequestId) return;

      final memories = await ApiService.instance.searchMemories(
        query: _searchController.text,
        collectionId: _selectedCollectionId,
        startDate: _dateRange?.start.toIso8601String().split('T').first,
        endDate: _dateRange?.end.toIso8601String().split('T').first,
      );
      if (reqId != _workspaceRequestId) return;

      final timeline = await ApiService.instance.getMemoryTimeline(
        collectionId: _selectedCollectionId,
        startDate: _dateRange?.start.toIso8601String().split('T').first,
        endDate: _dateRange?.end.toIso8601String().split('T').first,
      );
      if (reqId != _workspaceRequestId) return;

      final onThisDay = await ApiService.instance.getOnThisDayMemories();
      if (reqId != _workspaceRequestId) return;

      if (!mounted) return;
      setState(() {
        _collections = collections;
        _memories = memories;
        _timeline = timeline;
        _onThisDay = onThisDay;

        // Reconcile selection: only keep IDs that still exist in results
        final currentMemoryIds = memories.map((m) => m.id).toSet();
        _selectedForMerge.retainWhere((id) => currentMemoryIds.contains(id));
      });
    } catch (e, s) {
      if (reqId != _workspaceRequestId) return;
      developer.log('memory_workspace load failed', error: e, stackTrace: s);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not load memory workspace.')),
      );
    } finally {
      if (reqId == _workspaceRequestId && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _createCollection() async {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();

    final created = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New collection'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (created != true) return;
    if (nameController.text.trim().isEmpty) return;

    try {
      final collection = await ApiService.instance.createMemoryCollection(
        nameController.text.trim(),
        description: descriptionController.text.trim().isEmpty
            ? null
            : descriptionController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _collections = [..._collections, collection]
          ..sort((a, b) => a.name.compareTo(b.name));
        _selectedCollectionId = collection.id;
      });
      await _loadWorkspace();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to create collection.')),
      );
    }
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: _dateRange,
    );
    if (picked == null) return;
    setState(() => _dateRange = picked);
    await _loadWorkspace();
  }

  Future<void> _mergeSelected() async {
    if (_selectedForMerge.length < 2) return;
    try {
      await ApiService.instance.mergeMemories(_selectedForMerge.toList());
      if (!mounted) return;
      setState(() => _selectedForMerge.clear());
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Memories merged.')));
      await _loadWorkspace();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to merge selected memories.')),
      );
    }
  }

  Future<void> _exportMemories(String format) async {
    try {
      final exported = await ApiService.instance.exportMemories(
        format,
        collectionId: _selectedCollectionId,
      );
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Exported as ${format.toUpperCase()}'),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(child: Text(exported)),
          ),
          actions: [
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: exported));
                if (!context.mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export copied to clipboard.')),
                );
              },
              child: const Text('Copy'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to export memories: $e')),
      );
    }
  }

  Future<void> _moveMemoryToCollection(WorkspaceMemory memory) async {
    final selected = await showModalBottomSheet<String?>(
      context: context,
      builder: (context) => ListView(
        children: [
          const ListTile(title: Text('Move to collection')),
          ListTile(
            title: const Text('No collection'),
            onTap: () => Navigator.pop(context, ''),
          ),
          ..._collections.map(
            (collection) => ListTile(
              title: Text(collection.name),
              onTap: () => Navigator.pop(context, collection.id),
            ),
          ),
        ],
      ),
    );

    if (selected == null) return;
    try {
      await ApiService.instance.organizeMemories([
        memory.id,
      ], collectionId: selected.isEmpty ? null : selected);
      if (!mounted) return;
      await _loadWorkspace();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to move memory: $e')),
      );
    }
  }

  Future<void> _onReorder(int oldIndex, int newIndex) async {
    if (_selectedCollectionId == null) return;
    if (newIndex > oldIndex) {
      newIndex -= 1;
    }
    final previous = [..._memories];
    final updated = [..._memories];
    final item = updated.removeAt(oldIndex);
    updated.insert(newIndex, item);
    setState(() => _memories = updated);

    try {
      await ApiService.instance.organizeMemories(
        updated.map((m) => m.id).toList(),
        collectionId: _selectedCollectionId,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _memories = previous);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to reorder: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Memory Workspace'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.ios_share_rounded),
            onSelected: _exportMemories,
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'json', child: Text('Export JSON')),
              PopupMenuItem(value: 'csv', child: Text('Export CSV')),
              PopupMenuItem(value: 'markdown', child: Text('Export Markdown')),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadWorkspace,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  _buildOnThisDayCard(colors),
                  const SizedBox(height: AppSpacing.md),
                  _buildFilters(),
                  const SizedBox(height: AppSpacing.md),
                  _buildModes(),
                  const SizedBox(height: AppSpacing.sm),
                  if (_timelineMode)
                    _buildTimeline()
                  else
                    _buildDraggableList(),
                ],
              ),
            ),
      floatingActionButton: _selectedForMerge.length > 1
          ? FloatingActionButton.extended(
              onPressed: _mergeSelected,
              icon: const Icon(Icons.merge_type_rounded),
              label: Text('Merge (${_selectedForMerge.length})'),
            )
          : null,
    );
  }

  Widget _buildOnThisDayCard(AppThemeColors colors) {
    if (_onThisDay.isEmpty) {
      return const SizedBox.shrink();
    }

    return AppCard(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.history_rounded,
                  color: colors.primary,
                  size: AppSpacing.iconMd,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'On this day',
                  style: AppTypography.headingSmall.copyWith(
                    color: colors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            ..._onThisDay
                .take(3)
                .map(
                  (memory) => Text(
                    '- ${memory.content}',
                    style: AppTypography.bodySmall.copyWith(
                      color: colors.onSurface,
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _searchController,
                onSubmitted: (_) => _loadWorkspace(),
                decoration: InputDecoration(
                  hintText: 'Semantic + keyword search memories',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.tune_rounded),
                    tooltip: 'Date filter',
                    onPressed: _pickDateRange,
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _createCollection,
              icon: const Icon(Icons.create_new_folder_rounded),
              label: const Text('New'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        DropdownButtonFormField<String?>(
          initialValue: _selectedCollectionId,
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('All collections'),
            ),
            ..._collections.map(
              (collection) => DropdownMenuItem<String?>(
                value: collection.id,
                child: Text(collection.name),
              ),
            ),
          ],
          onChanged: (value) async {
            setState(() => _selectedCollectionId = value);
            await _loadWorkspace();
          },
        ),
      ],
    );
  }

  Widget _buildModes() {
    return SegmentedButton<bool>(
      segments: const [
        ButtonSegment<bool>(
          value: false,
          icon: Icon(Icons.view_list_rounded),
          label: Text('Organize'),
        ),
        ButtonSegment<bool>(
          value: true,
          icon: Icon(Icons.timeline_rounded),
          label: Text('Timeline'),
        ),
      ],
      selected: {_timelineMode},
      showSelectedIcon: false,
      onSelectionChanged: (value) {
        if (value.isEmpty) return;
        setState(() => _timelineMode = value.first);
      },
    );
  }

  Widget _buildDraggableList() {
    if (_memories.isEmpty) {
      return const AppEmptyState(
        title: 'No matching memories',
        subtitle: 'Try a different search or collection filter.',
      );
    }

    final list = _selectedCollectionId == null
        ? ListView.builder(
            itemCount: _memories.length,
            itemBuilder: (context, index) => _buildMemoryTile(_memories[index]),
          )
        : ReorderableListView.builder(
            onReorder: _onReorder,
            itemCount: _memories.length,
            itemBuilder: (context, index) => _buildMemoryTile(_memories[index]),
          );

    return SizedBox(height: 560, child: list);
  }

  Widget _buildMemoryTile(WorkspaceMemory memory) {
    final isSelected = _selectedForMerge.contains(memory.id);
    return Card(
      key: ValueKey<String>(memory.id),
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: ListTile(
        leading: Checkbox(
          value: isSelected,
          onChanged: (value) {
            setState(() {
              if (value == true) {
                _selectedForMerge.add(memory.id);
              } else {
                _selectedForMerge.remove(memory.id);
              }
            });
          },
        ),
        title: Text(memory.content),
        subtitle: Text(AppDateUtils.formatDate(memory.createdAt)),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'move') {
              _moveMemoryToCollection(memory);
            }
          },
          itemBuilder: (context) => const [
            PopupMenuItem(value: 'move', child: Text('Move to collection')),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    if (_timeline.isEmpty) {
      return const AppEmptyState(
        title: 'No timeline entries',
        subtitle: 'Add or search memories to see chronology.',
      );
    }

    return Column(
      children: _timeline
          .map(
            (bucket) => ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
              ),
              title: Text(bucket.day),
              subtitle: Text('${bucket.memories.length} memories'),
              children: bucket.memories
                  .map(
                    (memory) => ListTile(
                      title: Text(memory.content),
                      subtitle: Text(AppDateUtils.formatDate(memory.createdAt)),
                    ),
                  )
                  .toList(),
            ),
          )
          .toList(),
    );
  }
}
