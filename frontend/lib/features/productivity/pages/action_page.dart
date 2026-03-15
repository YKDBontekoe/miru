import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/design_system/design_system.dart';
import '../models/calendar_event.dart';
import 'tasks_page.dart';
import 'notes_page.dart';
import '../../../core/api/agents_service.dart';

final calendarEventsProvider =
    FutureProvider.autoDispose<List<CalendarEvent>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listCalendarEvents();
});

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
        children: const [
          _CalendarTab(),
          TasksPage(),
          NotesPage(),
        ],
      ),
    );
  }
}

class _CalendarTab extends ConsumerWidget {
  const _CalendarTab();

  void _showEventDialog(BuildContext context, WidgetRef ref,
      [CalendarEvent? existingEvent]) {
    final titleController = TextEditingController(text: existingEvent?.title);
    final descController =
        TextEditingController(text: existingEvent?.description);

    // Default to next hour
    final now = DateTime.now();
    final defaultStart = DateTime(now.year, now.month, now.day, now.hour + 1);
    final defaultEnd = defaultStart.add(const Duration(hours: 1));

    DateTime selectedStart = existingEvent?.startTime ?? defaultStart;
    DateTime selectedEnd = existingEvent?.endTime ?? defaultEnd;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setState) {
        return AlertDialog(
          title: Text(existingEvent == null ? 'New Event' : 'Edit Event'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Title'),
                  autofocus: true,
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(
                      labelText: 'Description (optional)'),
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
                          initialDate: selectedStart,
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (date != null && context.mounted) {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.fromDateTime(selectedStart),
                          );
                          if (time != null) {
                            setState(() {
                              selectedStart = DateTime(
                                date.year,
                                date.month,
                                date.day,
                                time.hour,
                                time.minute,
                              );
                              if (selectedEnd.isBefore(selectedStart)) {
                                selectedEnd =
                                    selectedStart.add(const Duration(hours: 1));
                              }
                            });
                          }
                        }
                      },
                      child: Text(
                          DateFormat('MMM d, h:mm a').format(selectedStart)),
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
                          initialDate: selectedEnd,
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (date != null && context.mounted) {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.fromDateTime(selectedEnd),
                          );
                          if (time != null) {
                            setState(() {
                              selectedEnd = DateTime(
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
                      child:
                          Text(DateFormat('MMM d, h:mm a').format(selectedEnd)),
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
              onPressed: () async {
                final title = titleController.text.trim();
                if (title.isEmpty) return;

                final service = ref.read(productivityServiceProvider);

                try {
                  if (existingEvent == null) {
                    await service.createCalendarEvent(CalendarEventCreate(
                      title: title,
                      description: descController.text.trim(),
                      startTime: selectedStart.toUtc(),
                      endTime: selectedEnd.toUtc(),
                    ));
                  } else {
                    await service.updateCalendarEvent(
                      existingEvent.id,
                      CalendarEventUpdate(
                        title: title,
                        description: descController.text.trim(),
                        startTime: selectedStart.toUtc(),
                        endTime: selectedEnd.toUtc(),
                      ),
                    );
                  }
                  if (context.mounted) {
                    Navigator.pop(context);
                    ref.invalidate(calendarEventsProvider);
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to save event')),
                    );
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(calendarEventsProvider);

    return Scaffold(
      body: eventsAsync.when(
        data: (events) {
          if (events.isEmpty) {
            return const Center(child: Text('No events yet. Add one!'));
          }

          return ListView.builder(
            padding: EdgeInsets.only(
              top: AppSpacing.md,
              left: AppSpacing.md,
              right: AppSpacing.md,
              bottom: AppSpacing.bottomNavBarHeight +
                  AppSpacing.md * 2 +
                  MediaQuery.viewPaddingOf(context).bottom,
            ),
            itemCount: events.length,
            itemBuilder: (context, index) {
              final event = events[index];
              return _EventTile(
                event: event,
                onEdit: () => _showEventDialog(context, ref, event),
                onDelete: () async {
                  try {
                    await ref
                        .read(productivityServiceProvider)
                        .deleteCalendarEvent(event.id);
                    ref.invalidate(calendarEventsProvider);
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to delete event')),
                      );
                    }
                  }
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Unable to load events.'),
              TextButton(
                onPressed: () => ref.invalidate(calendarEventsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: Padding(
        padding: EdgeInsets.only(
            bottom: AppSpacing.bottomNavBarHeight +
                AppSpacing.md +
                MediaQuery.viewPaddingOf(context).bottom),
        child: FloatingActionButton(
          heroTag: 'calendar_fab',
          onPressed: () => _showEventDialog(context, ref),
          child: const Icon(Icons.add),
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
            title: Text(event.title,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (event.description != null && event.description!.isNotEmpty)
                  Text(event.description!,
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time,
                        size: 14, color: context.colorScheme.primary),
                    const SizedBox(width: 4),
                    Text(
                      event.isAllDay
                          ? 'All Day - ${dateFormat.format(startLocal)}'
                          : '${dateFormat.format(startLocal)} ${timeFormat.format(startLocal)} - ${timeFormat.format(endLocal)}',
                      style: TextStyle(
                          color: context.colorScheme.primary, fontSize: 12),
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
                          Icon(Icons.smart_toy_outlined,
                              size: 14, color: context.colorScheme.primary),
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
                          Icon(Icons.info_outline,
                              size: 14,
                              color: context.colorScheme.onSurfaceVariant),
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
