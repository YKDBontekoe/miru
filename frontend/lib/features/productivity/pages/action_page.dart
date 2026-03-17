import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:miru/core/api/productivity_service.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';

import '../models/calendar_event.dart';
import '../../../core/models/task.dart';
import '../../../core/models/note.dart';

// Provide a single instance of ProductivityService
final productivityServiceProvider = Provider((ref) => ProductivityService());

// Selected date for the dashboard
final selectedDateProvider = StateProvider<DateTime>((ref) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day);
});

// Tasks Provider
final tasksProvider = FutureProvider.autoDispose<List<Task>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listTasks();
});

// Notes Provider
final notesProvider = FutureProvider.autoDispose<List<Note>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listNotes();
});

// Calendar Events Provider
final calendarEventsProvider = FutureProvider.autoDispose<List<CalendarEvent>>((
  ref,
) async {
  final service = ref.watch(productivityServiceProvider);
  // We fetch a reasonable number of events for the dashboard
  return service.listCalendarEvents(limit: 100);
});

// A composite state to hold all dashboard data
class DashboardState {
  final AsyncValue<List<CalendarEvent>> events;
  final AsyncValue<List<Task>> tasks;
  final AsyncValue<List<Note>> notes;

  DashboardState({
    required this.events,
    required this.tasks,
    required this.notes,
  });

  bool get isLoading => events.isLoading || tasks.isLoading || notes.isLoading;
  bool get hasError => events.hasError || tasks.hasError || notes.hasError;
}

// The unified dashboard provider
final dashboardProvider = Provider.autoDispose<DashboardState>((ref) {
  final events = ref.watch(calendarEventsProvider);
  final tasks = ref.watch(tasksProvider);
  final notes = ref.watch(notesProvider);

  return DashboardState(events: events, tasks: tasks, notes: notes);
});

class ActionPage extends ConsumerStatefulWidget {
  const ActionPage({super.key});

  @override
  ConsumerState<ActionPage> createState() => _ActionPageState();
}

class _ActionPageState extends ConsumerState<ActionPage> {
  final TextEditingController _inputController = TextEditingController();
  bool _isSending = false;
  String? _lastResponse;

  // Weekly calendar scroll controller
  final ScrollController _weekScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Scroll to center today on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_weekScrollController.hasClients) {
        // Approximate width of a day item is 60. Center it.
        final screenWidth = MediaQuery.of(context).size.width;
        final offset = (3 * 60.0) - (screenWidth / 2) + 30.0;
        _weekScrollController.jumpTo(offset > 0 ? offset : 0);
      }
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _weekScrollController.dispose();
    super.dispose();
  }

  Future<void> _handleAiInput(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _isSending = true;
      _lastResponse = null;
    });

    try {
      final result = await ApiService.instance.runCrew(text);

      if (!mounted) return;

      setState(() {
        _lastResponse = result.result;
      });

      // Refresh providers
      ref.invalidate(tasksProvider);
      ref.invalidate(notesProvider);
      ref.invalidate(calendarEventsProvider);

      _inputController.clear();

      // Also show a snackbar with the result
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.result),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to process request: $e'),
          backgroundColor: context.colors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  // Generate a week of dates around today
  List<DateTime> _getWeekDays() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return List.generate(
      7,
      (index) => today.subtract(Duration(days: 3 - index)),
    );
  }

  Widget _buildSectionHeader(String title, {Widget? action}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppTypography.headingSmall.copyWith(
              color: context.colors.onSurface,
            ),
          ),
          if (action != null) action,
        ],
      ),
    );
  }

  Widget _buildWeeklyCalendar(DateTime selectedDate) {
    final weekDays = _getWeekDays();
    final colors = context.colors;

    return SizedBox(
      height: 80,
      child: ListView.builder(
        controller: _weekScrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: weekDays.length,
        itemBuilder: (context, index) {
          final date = weekDays[index];
          final isSelected = date.isAtSameMomentAs(selectedDate);
          final isToday = date.isAtSameMomentAs(
            DateTime(
              DateTime.now().year,
              DateTime.now().month,
              DateTime.now().day,
            ),
          );

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () =>
                    ref.read(selectedDateProvider.notifier).state = date,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 60,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? colors.primary
                        : (isToday
                              ? colors.primary.withValues(alpha: 0.1)
                              : colors.surfaceHigh),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: Border.all(
                      color: isSelected
                          ? colors.primary
                          : colors.border.withValues(alpha: 0.5),
                      width: 1,
                    ),
                    boxShadow: isSelected ? AppShadows.sm : [],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        DateFormat('E').format(date).toUpperCase(),
                        style: AppTypography.labelSmall.copyWith(
                          color: isSelected
                              ? colors.surfaceHigh
                              : colors.onSurfaceMuted,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        date.day.toString(),
                        style: AppTypography.headingMedium.copyWith(
                          color: isSelected
                              ? colors.surfaceHigh
                              : colors.onSurface,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTodayEvents(
    AsyncValue<List<CalendarEvent>> eventsAsync,
    DateTime selectedDate,
  ) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: eventsAsync.when(
        data: (events) {
          final dayEvents = events.where((e) {
            final start = e.startTime.toLocal();
            return start.year == selectedDate.year &&
                start.month == selectedDate.month &&
                start.day == selectedDate.day;
          }).toList();

          dayEvents.sort((a, b) => a.startTime.compareTo(b.startTime));

          if (dayEvents.isEmpty) {
            return _buildEmptyState(
              icon: Icons.event_available_rounded,
              message: "No events today — want me to schedule something?",
            );
          }

          return ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            itemCount: dayEvents.length,
            itemBuilder: (context, index) {
              final event = dayEvents[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Container(
                  decoration: BoxDecoration(
                    color: context.colors.surfaceHigh,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: Border.all(
                      color: context.colors.border.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 4,
                          height: 40,
                          decoration: BoxDecoration(
                            color: context.colors.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                event.title,
                                style: AppTypography.labelLarge.copyWith(
                                  color: context.colors.onSurface,
                                ),
                              ),
                              if (event.description != null &&
                                  event.description!.isNotEmpty) ...[
                                const SizedBox(height: AppSpacing.xxs),
                                Text(
                                  event.description!,
                                  style: AppTypography.bodySmall.copyWith(
                                    color: context.colors.onSurfaceMuted,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                              const SizedBox(height: AppSpacing.xs),
                              Row(
                                children: [
                                  Icon(
                                    Icons.access_time_rounded,
                                    size: 14,
                                    color: context.colors.onSurfaceMuted,
                                  ),
                                  const SizedBox(width: AppSpacing.xxs),
                                  Text(
                                    '\${DateFormat(\'h:mm a\').format(event.startTime.toLocal())} - \${DateFormat(\'h:mm a\').format(event.endTime.toLocal())}',
                                    style: AppTypography.caption.copyWith(
                                      color: context.colors.onSurfaceMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: CircularProgressIndicator(),
          ),
        ),
        error: (e, _) => Center(child: Text('Error loading events: $e')),
      ),
    );
  }

  Widget _buildTasksSection(AsyncValue<List<Task>> tasksAsync) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: tasksAsync.when(
        data: (tasks) {
          final pendingTasks = tasks.where((t) => !t.isCompleted).toList();

          if (pendingTasks.isEmpty) {
            return _buildEmptyState(
              icon: Icons.task_alt_rounded,
              message: "All caught up! Any new tasks for me?",
            );
          }

          return ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            itemCount: pendingTasks.length,
            itemBuilder: (context, index) {
              final task = pendingTasks[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Container(
                  decoration: BoxDecoration(
                    color: context.colors.surfaceHigh,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    border: Border.all(
                      color: context.colors.border.withValues(alpha: 0.5),
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: 0,
                    ),
                    leading: Icon(
                      Icons.radio_button_unchecked_rounded,
                      color: context.colors.onSurfaceMuted,
                    ),
                    title: Text(
                      task.title,
                      style: AppTypography.labelLarge.copyWith(
                        color: context.colors.onSurface,
                      ),
                    ),
                    subtitle:
                        task.description != null && task.description!.isNotEmpty
                        ? Text(
                            task.description!,
                            style: AppTypography.bodySmall.copyWith(
                              color: context.colors.onSurfaceMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        : null,
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: CircularProgressIndicator(),
          ),
        ),
        error: (e, _) => Center(child: Text('Error loading tasks: $e')),
      ),
    );
  }

  Widget _buildNotesSection(AsyncValue<List<Note>> notesAsync) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: notesAsync.when(
        data: (notes) {
          if (notes.isEmpty) {
            return _buildEmptyState(
              icon: Icons.note_alt_outlined,
              message: "No notes here. Need me to jot something down?",
            );
          }

          final sortedNotes = List<Note>.from(notes)
            ..sort((a, b) {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return b.createdAt.compareTo(a.createdAt);
            });

          return SizedBox(
            height: 140,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: sortedNotes.length,
              itemBuilder: (context, index) {
                final note = sortedNotes[index];
                return Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.md),
                  child: Container(
                    width: 200,
                    decoration: BoxDecoration(
                      color: note.isPinned
                          ? context.colors.primary.withValues(alpha: 0.05)
                          : context.colors.surfaceHigh,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      border: Border.all(
                        color: note.isPinned
                            ? context.colors.primary.withValues(alpha: 0.3)
                            : context.colors.border.withValues(alpha: 0.5),
                      ),
                    ),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                note.title,
                                style: AppTypography.labelLarge.copyWith(
                                  color: context.colors.onSurface,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (note.isPinned)
                              Icon(
                                Icons.push_pin_rounded,
                                size: 14,
                                color: context.colors.primary,
                              ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            note.content,
                            style: AppTypography.bodySmall.copyWith(
                              color: context.colors.onSurfaceMuted,
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: CircularProgressIndicator(),
          ),
        ),
        error: (e, _) => Center(child: Text('Error loading notes: $e')),
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String message}) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: context.colors.surfaceHigh,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: context.colors.border.withValues(alpha: 0.3),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: context.colors.onSurfaceMuted.withValues(alpha: 0.5),
              size: 32,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: AppTypography.bodyMedium.copyWith(
                color: context.colors.onSurfaceMuted,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final dashboard = ref.watch(dashboardProvider);
    final selectedDate = ref.watch(selectedDateProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text('Assistant', style: AppTypography.headingMedium),
        backgroundColor: colors.surfaceHigh,
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: colors.border.withValues(alpha: 0.5),
            height: 1,
          ),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(tasksProvider);
                    ref.invalidate(notesProvider);
                    ref.invalidate(calendarEventsProvider);
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: AppSpacing.md),
                        _buildWeeklyCalendar(selectedDate),

                        _buildSectionHeader(
                          'Events',
                          action: Icon(
                            Icons.chevron_right_rounded,
                            color: colors.onSurfaceMuted,
                          ),
                        ),
                        _buildTodayEvents(dashboard.events, selectedDate),

                        _buildSectionHeader(
                          'Tasks',
                          action: Icon(
                            Icons.chevron_right_rounded,
                            color: colors.onSurfaceMuted,
                          ),
                        ),
                        _buildTasksSection(dashboard.tasks),

                        _buildSectionHeader(
                          'Notes',
                          action: Icon(
                            Icons.chevron_right_rounded,
                            color: colors.onSurfaceMuted,
                          ),
                        ),
                        _buildNotesSection(dashboard.notes),

                        if (_lastResponse != null)
                          Padding(
                            padding: const EdgeInsets.all(AppSpacing.lg),
                            child: Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration: BoxDecoration(
                                color: colors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusLg,
                                ),
                                border: Border.all(
                                  color: colors.primary.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.check_circle_rounded,
                                    color: colors.primary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: AppSpacing.sm),
                                  Expanded(
                                    child: Text(
                                      _lastResponse!,
                                      style: AppTypography.bodyMedium.copyWith(
                                        color: colors.onSurface,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                        const SizedBox(
                          height: AppSpacing.xxl * 3,
                        ), // padding for bottom bar
                      ],
                    ),
                  ),
                ),
              ),
              ChatInputBar(
                controller: _inputController,
                onSend: () => _handleAiInput(_inputController.text),
                isStreaming: _isSending,
                onStopStreaming: null,
                hintText: 'Ask me to schedule, remind, or note...',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
