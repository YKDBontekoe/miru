import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/note.dart';
import '../../../core/models/agent.dart';
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
      content: Column(
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
            maxLines: 5,
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
      appBar: AppBar(
        title: Text('Notes', style: AppTypography.headingMedium),
        backgroundColor: context.colorScheme.surface,
        elevation: 0,
      ),
      body: notesAsync.when(
        data: (notes) {
          if (notes.isEmpty) {
            return const Center(child: Text('No notes yet. Add one!'));
          }
          final agents = agentsAsync.valueOrNull ?? [];
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
  final List<Agent> agents;

  const _NoteTile({required this.note, required this.agents});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.read(productivityServiceProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainer,
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
              maxLines: 5,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => _showNoteDialog(context, ref, note),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () async {
                    try {
                      await service.deleteNote(note.id);
                      ref.invalidate(notesProvider);
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Failed to delete note'),
                          ),
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
                left: AppSpacing.xl + AppSpacing.md,
                right: AppSpacing.md,
                bottom: AppSpacing.sm,
              ),
              child: Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.xs,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (note.agentId != null)
                    () {
                      final agent =
                          agents.where((a) => a.id == note.agentId).firstOrNull;
                      if (agent == null) return const SizedBox.shrink();
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.xs,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: context.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(
                            AppSpacing.radiusXs,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.smart_toy_outlined,
                              size: 12,
                              color: context.colorScheme.onPrimaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              agent.name,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: context.colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ],
                        ),
                      );
                    }(),
                  if (note.originContext != null)
                    Flexible(
                      child: Text(
                        'Context: ${note.originContext}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: context.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
