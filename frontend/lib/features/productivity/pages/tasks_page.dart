import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/productivity_service.dart';
import '../../../core/models/task.dart';
import '../../../core/design_system/design_system.dart';

// Provide a single instance of ProductivityService
final productivityServiceProvider = Provider((ref) => ProductivityService());

final tasksProvider = FutureProvider.autoDispose<List<Task>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listTasks();
});

void _showTaskDialog(
  BuildContext context,
  WidgetRef ref, [
  Task? existingTask,
]) {
  final titleController = TextEditingController(text: existingTask?.title);
  final descController = TextEditingController(text: existingTask?.description);

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(existingTask == null ? 'New Task' : 'Edit Task'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: titleController,
            decoration: const InputDecoration(labelText: 'Title'),
            autofocus: true,
          ),
          TextField(
            controller: descController,
            decoration: const InputDecoration(
              labelText: 'Description (optional)',
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            final title = titleController.text.trim();
            if (title.isEmpty) return;

            final service = ref.read(productivityServiceProvider);

            try {
              if (existingTask == null) {
                await service.createTask(
                  title,
                  description: descController.text.trim(),
                );
              } else {
                await service.updateTask(
                  existingTask.id,
                  title: title,
                  description: descController.text.trim(),
                );
              }

              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
              ref.invalidate(tasksProvider);
            } catch (e) {
              if (ctx.mounted) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to save task. Please try again.'),
                  ),
                );
              }
            }
          },
          child: const Text('Save'),
        ),
      ],
    ),
  );
}

class TasksPage extends ConsumerWidget {
  const TasksPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);

    return Scaffold(
      backgroundColor: context.colorScheme.surface,
      appBar: AppBar(
        title: Text('Tasks', style: AppTypography.headingMedium),
        backgroundColor: context.colorScheme.surface,
        elevation: 0,
      ),
      body: tasksAsync.when(
        data: (tasks) {
          if (tasks.isEmpty) {
            return const Center(child: Text('No tasks yet. Add one!'));
          }
          return ListView.separated(
            padding: EdgeInsets.only(
              left: AppSpacing.md,
              right: AppSpacing.md,
              top: AppSpacing.md,
              bottom: AppSpacing.bottomNavBarHeight +
                  AppSpacing.md * 2 +
                  MediaQuery.viewPaddingOf(context).bottom,
            ),
            itemCount: tasks.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final task = tasks[index];
              return _TaskTile(task: task);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Unable to load tasks. Please try again.'),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => ref.invalidate(tasksProvider),
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
              MediaQuery.viewPaddingOf(context).bottom,
        ),
        child: FloatingActionButton(
          onPressed: () => _showTaskDialog(context, ref),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class _TaskTile extends ConsumerWidget {
  final Task task;

  const _TaskTile({required this.task});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.read(productivityServiceProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: ListTile(
        leading: Checkbox(
          value: task.isCompleted,
          onChanged: (val) async {
            if (val == null) return;
            try {
              await service.updateTask(task.id, isCompleted: val);
              ref.invalidate(tasksProvider);
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to update task')),
                );
              }
            }
          },
        ),
        title: Text(
          task.title,
          style: task.isCompleted
              ? const TextStyle(decoration: TextDecoration.lineThrough)
              : null,
        ),
        subtitle: task.description != null && task.description!.isNotEmpty
            ? Text(task.description!)
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => _showTaskDialog(context, ref, task),
            ),
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () async {
                try {
                  await service.deleteTask(task.id);
                  ref.invalidate(tasksProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to delete task')),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
