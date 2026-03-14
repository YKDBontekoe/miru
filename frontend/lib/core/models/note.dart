import 'package:freezed_annotation/freezed_annotation.dart';

part 'note.freezed.dart';
part 'note.g.dart';

@freezed
class Note with _$Note {
  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory Note({
    required String id,
    required String userId,
    String? agentId,
    String? originMessageId,
    String? originContext,
    required String title,
    required String content,
    @Default(false) bool isPinned,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Note;

  factory Note.fromJson(Map<String, dynamic> json) => _$NoteFromJson(json);
}
