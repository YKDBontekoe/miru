import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/productivity_service.dart';
import '../../../core/models/note.dart';
import '../../../core/design_system/design_system.dart';

final notesProvider = FutureProvider.autoDispose<List<Note>>((ref) async {
  final service = ref.watch(productivityServiceProvider);
  return service.listNotes();
});

class NotesPage extends ConsumerWidget {
  const NotesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(notesProvider);

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
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: notes.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final note = notes[index];
              return _NoteTile(note: note);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showNoteDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showNoteDialog(BuildContext context, WidgetRef ref,
      [Note? existingNote]) {
    final titleController = TextEditingController(text: existingNote?.title);
    final contentController =
        TextEditingController(text: existingNote?.content);

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

              Navigator.pop(ctx);
              final service = ref.read(productivityServiceProvider);

              if (existingNote == null) {
                await service.createNote(title, content);
              } else {
                await service.updateNote(
                  existingNote.id,
                  title: title,
                  content: content,
                );
              }
              ref.invalidate(notesProvider);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _NoteTile extends ConsumerWidget {
  final Note note;

  const _NoteTile({required this.note});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.read(productivityServiceProvider);

    return AppCard(
      child: ListTile(
        leading: IconButton(
          icon: Icon(
            note.isPinned ? Icons.push_pin : Icons.push_pin_outlined,
            color: note.isPinned ? context.colorScheme.primary : null,
          ),
          onPressed: () async {
            await service.updateNote(note.id, isPinned: !note.isPinned);
            ref.invalidate(notesProvider);
          },
        ),
        title: Text(note.title,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          note.content,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () async {
            await service.deleteNote(note.id);
            ref.invalidate(notesProvider);
          },
        ),
      ),
    );
  }
}
