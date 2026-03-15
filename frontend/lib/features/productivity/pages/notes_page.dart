import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/note.dart';
import '../../../core/design_system/design_system.dart';
import '../../../core/api/agents_service.dart';
import 'tasks_page.dart'; // To access productivityServiceProvider

final notesProvider = FutureProvider.autoDispose<List<Note>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listNotes();
});

void _showNoteDialog(
  BuildContext context,
  WidgetRef ref, [
  Note? existingNote,
]) {
  final titleController = TextEditingController(text: existingNote?.title);
  final contentController = TextEditingController(text: existingNote?.content);

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(existingNote == null ? 'New Note' : 'Edit Note'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Title'),
              autofocus: true,
            ),
            TextField(
              controller: contentController,
              decoration: const InputDecoration(labelText: 'Content'),
              maxLines: 8,
              minLines: 3,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            final title = titleController.text.trim();
            final content = contentController.text.trim();

            if (title.isEmpty || content.isEmpty) return;

            final service = ref.read(productivityServiceProvider);

            try {
              if (existingNote == null) {
                await service.createNote(title, content);
              } else {
                await service.updateNote(
                  existingNote.id,
                  title: title,
                  content: content,
                );
              }

              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
              ref.invalidate(notesProvider);
            } catch (e) {
              if (ctx.mounted) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to save note. Please try again.'),
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

class NotesPage extends ConsumerWidget {
  const NotesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(notesProvider);
    final agentsAsync = ref.watch(agentsProvider);

    return Scaffold(
      backgroundColor: context.colorScheme.surface,
      body: notesAsync.when(
        data: (notes) {
          if (notes.isEmpty) {
            return const Center(child: Text('No notes yet. Add one!'));
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
            itemCount: notes.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final note = notes[index];
              // Resolve conflict: Extract agents list to pass into tile
              final agents = agentsAsync.value ?? [];
              return _NoteTile(note: note, agents: agents);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Unable to load notes. Please try again.'),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => ref.invalidate(notesProvider),
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
          onPressed: () => _showNoteDialog(context, ref),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class _NoteTile extends ConsumerWidget {
  final Note note;
  final List<Agent> agents; // Keeping the main branch parameter requirement

  const _NoteTile({required this.note, required this.agents});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.read(productivityServiceProvider);

    return Container(
      decoration: BoxDecoration(
        color: note.isPinned
            ? context.colorScheme.primaryContainer.withValues(alpha: 0.3)
            : context.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            leading: IconButton(
              icon: Icon(
                note.isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                color: note.isPinned ? context.colorScheme.primary : null,
              ),
              onPressed: () async {
                try {
                  await service.updateNote(note.id, isPinned: !note.isPinned);
                  ref.invalidate(notesProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to pin note')),
                    );
                  }
                }
              },
            ),
            title: Text(
              note.title,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              note.content,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, size: 20),
                  onPressed: () => _showNoteDialog(context, ref, note),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20),
                  onPressed: () async {
                    try {
                      await service.deleteNote(note.id);
                      ref.invalidate(notesProvider);
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to delete note')),
                        );
                      }
                    }
                  },
                ),
              ],
            ),
          ),
          if (note.agentId != null || note.originContext != null)
            Padding(
              padding: const EdgeInsets.only(
                left: AppSpacing.xxxl,
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
                    if (note.agentId != null)
                      Row(
                        children: [
                          Icon(Icons.smart_toy_outlined,
                              size: 14, color: context.colorScheme.primary),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: () {
                              final agent = agents
                                  .where((a) => a.id == note.agentId)
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
                            }(),
                          ),
                        ],
                      ),
                    if (note.agentId != null && note.originContext != null)
                      const SizedBox(height: AppSpacing.xs),
                    if (note.originContext != null)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline,
                              size: 14,
                              color: context.colorScheme.onSurfaceVariant),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: Text(
                              'Context: ${note.originContext}',
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