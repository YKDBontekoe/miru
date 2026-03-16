import 'package:miru/core/api/productivity_service.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/design_system/design_system.dart';
import '../models/calendar_event.dart';
import 'tasks_page.dart';
import 'notes_page.dart';
import '../../../core/api/agents_service.dart';

class CalendarEventsState {
  final List<CalendarEvent> events;
  final bool isLoading;
  final bool hasError;
  final bool hasReachedEnd;

  const CalendarEventsState({
    this.events = const [],
    this.isLoading = false,
    this.hasError = false,
    this.hasReachedEnd = false,
  });

  CalendarEventsState copyWith({
    List<CalendarEvent>? events,
    bool? isLoading,
    bool? hasError,
    bool? hasReachedEnd,
  }) {
    return CalendarEventsState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      hasError: hasError ?? this.hasError,
      hasReachedEnd: hasReachedEnd ?? this.hasReachedEnd,
    );
  }
}

class CalendarEventsNotifier extends AutoDisposeNotifier<CalendarEventsState> {
  static const int _pageSize = 50;

  @override
  CalendarEventsState build() {
    unawaited(Future.microtask(() => _fetchPage(isRefresh: true)));
    return const CalendarEventsState(isLoading: true);
  }

  Future<void> _fetchPage({bool isRefresh = false}) async {
    if (state.isLoading && !isRefresh) return;

    final service = ref.read(productivityServiceProvider);

    if (isRefresh) {
      state = const CalendarEventsState(isLoading: true);
    } else {
      state = state.copyWith(isLoading: true);
    }

    try {
      final currentOffset = isRefresh ? 0 : state.events.length;
      final newEvents = await service.listCalendarEvents(
        limit: _pageSize,
        offset: currentOffset,
      );

      state = state.copyWith(
        events: isRefresh ? newEvents : [...state.events, ...newEvents],
        isLoading: false,
        hasReachedEnd: newEvents.length < _pageSize,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, hasError: true);
    }
  }

  Future<void> fetchNextPage() => _fetchPage();
  Future<void> refresh() => _fetchPage(isRefresh: true);
}

final calendarEventsProvider =
    AutoDisposeNotifierProvider<CalendarEventsNotifier, CalendarEventsState>(
      () {
        return CalendarEventsNotifier();
      },
    );

class ActionPage extends ConsumerStatefulWidget {
  const ActionPage({super.key});

  @override
  ConsumerState<ActionPage> createState() => _ActionPageState();
}

class _ActionPageState extends ConsumerState<ActionPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Action', style: AppTypography.headingMedium),
        bottom: TabBar(
          controller: _tabController,
          labelColor: context.colorScheme.primary,
          unselectedLabelColor: context.colorScheme.onSurfaceVariant,
          indicatorColor: context.colorScheme.primary,
          tabs: const [
            Tab(text: 'Calendar'),
            Tab(text: 'Tasks'),
            Tab(text: 'Notes'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_CalendarTab(), TasksPage(), NotesPage()],
      ),
    );
  }
}

class _CalendarTab extends ConsumerStatefulWidget {
  const _CalendarTab();

  @override
  ConsumerState<_CalendarTab> createState() => _CalendarTabState();
}

class _CalendarTabState extends ConsumerState<_CalendarTab> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(calendarEventsProvider.notifier).fetchNextPage();
    }
  }

  Future<void> _showEventDialog(
    BuildContext context, [
    CalendarEvent? existingEvent,
  ]) async {
    final productivityService = ref.read(productivityServiceProvider);
    void onRefresh() => ref.read(calendarEventsProvider.notifier).refresh();

    await showDialog(
      context: context,
      builder: (context) => _EventDialog(
        existingEvent: existingEvent,
        productivityService: productivityService,
        onRefresh: onRefresh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(calendarEventsProvider);

    return Scaffold(
      body: state.hasError && state.events.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Unable to load events.'),
                  TextButton(
                    onPressed: () =>
                        ref.read(calendarEventsProvider.notifier).refresh(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : state.isLoading && state.events.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.events.isEmpty
          ? const Center(child: Text('No events yet. Add one!'))
          : RefreshIndicator(
              onRefresh: () =>
                  ref.read(calendarEventsProvider.notifier).refresh(),
              child: ListView.builder(
                controller: _scrollController,
                padding: EdgeInsets.only(
                  top: AppSpacing.md,
                  left: AppSpacing.md,
                  right: AppSpacing.md,
                  bottom:
                      AppSpacing.bottomNavBarHeight +
                      AppSpacing.md * 2 +
                      MediaQuery.viewPaddingOf(context).bottom,
                ),
                itemCount: state.events.length + (state.isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == state.events.length) {
                    return const Padding(
                      padding: EdgeInsets.all(AppSpacing.md),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  final event = state.events[index];
                  return _EventTile(
                    event: event,
                    onEdit: () => _showEventDialog(context, event),
                    onDelete: () async {
                      try {
                        await ref
                            .read(productivityServiceProvider)
                            .deleteCalendarEvent(event.id);
                        ref.read(calendarEventsProvider.notifier).refresh();
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Failed to delete event'),
                            ),
                          );
                        }
                      }
                    },
                  );
                },
              ),
            ),
      floatingActionButton: Padding(
        padding: EdgeInsets.only(
          bottom:
              AppSpacing.bottomNavBarHeight +
              AppSpacing.md +
              MediaQuery.viewPaddingOf(context).bottom,
        ),
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: AppShadows.primaryGlow,
          ),
          child: FloatingActionButton(
            elevation: 0,
            heroTag: 'calendar_fab',
            onPressed: () => _showEventDialog(context),
            child: const Icon(Icons.add),
          ),
        ),
      ),
    );
  }
}

class _EventTile extends ConsumerWidget {
  final CalendarEvent event;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _EventTile({
    required this.event,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timeFormat = DateFormat('h:mm a');
    final dateFormat = DateFormat('MMM d');
    final agentsAsync = ref.watch(agentsProvider);

    // Convert UTC to local for display
    final startLocal = event.startTime.toLocal();
    final endLocal = event.endTime.toLocal();

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            title: Text(
              event.title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (event.description != null && event.description!.isNotEmpty)
                  Text(
                    event.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 14,
                      color: context.colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      event.isAllDay
                          ? 'All Day - ${dateFormat.format(startLocal)}'
                          : '${dateFormat.format(startLocal)} ${timeFormat.format(startLocal)} - ${timeFormat.format(endLocal)}',
                      style: TextStyle(
                        color: context.colorScheme.primary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, size: 20),
                  onPressed: onEdit,
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20),
                  onPressed: onDelete,
                ),
              ],
            ),
          ),
          if (event.agentId != null || event.originContext != null)
            Padding(
              padding: const EdgeInsets.only(
                left: AppSpacing.md,
                right: AppSpacing.md,
                bottom: AppSpacing.md,
              ),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: context.colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (event.agentId != null)
                      Row(
                        children: [
                          Icon(
                            Icons.smart_toy_outlined,
                            size: 14,
                            color: context.colorScheme.primary,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: agentsAsync.when(
                              data: (agents) {
                                final agent = agents
                                    .where((a) => a.id == event.agentId)
                                    .firstOrNull;
                                return Text(
                                  agent != null
                                      ? 'Created by ${agent.name}'
                                      : 'Created by Agent',
                                  style: AppTypography.labelSmall.copyWith(
                                    color: context.colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                );
                              },
                              loading: () => const Text('Loading agent...'),
                              error: (_, __) => const Text('Unknown Agent'),
                            ),
                          ),
                        ],
                      ),
                    if (event.agentId != null && event.originContext != null)
                      const SizedBox(height: AppSpacing.xs),
                    if (event.originContext != null)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.info_outline,
                            size: 14,
                            color: context.colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: Text(
                              'Context: ${event.originContext}',
                              style: AppTypography.labelSmall.copyWith(
                                color: context.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _EventDialog extends StatefulWidget {
  final CalendarEvent? existingEvent;
  final ProductivityService productivityService;
  final VoidCallback onRefresh;

  const _EventDialog({
    this.existingEvent,
    required this.productivityService,
    required this.onRefresh,
  });

  @override
  State<_EventDialog> createState() => _EventDialogState();
}

class _EventDialogState extends State<_EventDialog> {
  late final TextEditingController _titleController;
  late final TextEditingController _descController;
  late DateTime _selectedStart;
  late DateTime _selectedEnd;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.existingEvent?.title);
    _descController = TextEditingController(
      text: widget.existingEvent?.description,
    );

    final now = DateTime.now();
    final defaultStart = DateTime(now.year, now.month, now.day, now.hour + 1);
    final defaultEnd = defaultStart.add(const Duration(hours: 1));

    _selectedStart = widget.existingEvent?.startTime.toLocal() ?? defaultStart;
    _selectedEnd = widget.existingEvent?.endTime.toLocal() ?? defaultEnd;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.existingEvent == null ? 'New Event' : 'Edit Event'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Title'),
              autofocus: true,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _descController,
              decoration: const InputDecoration(
                labelText: 'Description (optional)',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                const Text('Start: '),
                TextButton(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _selectedStart,
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (date != null && context.mounted) {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.fromDateTime(_selectedStart),
                      );
                      if (time != null) {
                        if (!mounted) return;
                        setState(() {
                          _selectedStart = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                          if (_selectedEnd.isBefore(_selectedStart)) {
                            _selectedEnd = _selectedStart.add(
                              const Duration(hours: 1),
                            );
                          }
                        });
                      }
                    }
                  },
                  child: Text(
                    DateFormat('MMM d, h:mm a').format(_selectedStart),
                  ),
                ),
              ],
            ),
            Row(
              children: [
                const Text('End: '),
                TextButton(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _selectedEnd,
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (date != null && context.mounted) {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.fromDateTime(_selectedEnd),
                      );
                      if (time != null) {
                        if (!mounted) return;
                        setState(() {
                          _selectedEnd = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                        });
                      }
                    }
                  },
                  child: Text(DateFormat('MMM d, h:mm a').format(_selectedEnd)),
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSaving
              ? null
              : () async {
                  final title = _titleController.text.trim();
                  if (title.isEmpty) return;

                  if (_selectedEnd.isBefore(_selectedStart) ||
                      _selectedEnd.isAtSameMomentAs(_selectedStart)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('End time must be after start time'),
                        ),
                      );
                    }
                    return;
                  }

                  setState(() {
                    _isSaving = true;
                  });

                  try {
                    if (widget.existingEvent == null) {
                      await widget.productivityService.createCalendarEvent(
                        CalendarEventCreate(
                          title: title,
                          description: _descController.text.trim(),
                          startTime: _selectedStart.toUtc(),
                          endTime: _selectedEnd.toUtc(),
                        ),
                      );
                    } else {
                      await widget.productivityService.updateCalendarEvent(
                        widget.existingEvent!.id,
                        CalendarEventUpdate(
                          title: title,
                          description: _descController.text.trim(),
                          startTime: _selectedStart.toUtc(),
                          endTime: _selectedEnd.toUtc(),
                        ),
                      );
                    }
                    if (context.mounted) {
                      Navigator.pop(context);
                      widget.onRefresh();
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to save event')),
                      );
                    }
                  } finally {
                    if (mounted) {
                      setState(() {
                        _isSaving = false;
                      });
                    }
                  }
                },
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
      ],
    );
  }
}
