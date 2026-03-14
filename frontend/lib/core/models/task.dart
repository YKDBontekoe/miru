import 'package:freezed_annotation/freezed_annotation.dart';

part 'task.freezed.dart';
part 'task.g.dart';

@freezed
class Task with _$Task {
  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory Task({
    required String id,
    required String userId,
    required String title,
    String? description,
    @Default(false) bool isCompleted,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Task;

  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
