import 'package:freezed_annotation/freezed_annotation.dart';

part 'calendar_event.freezed.dart';
part 'calendar_event.g.dart';

@freezed
class CalendarEvent with _$CalendarEvent {
  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory CalendarEvent({
    required String id,
    required String userId,
    required String title,
    String? description,
    required DateTime startTime,
    required DateTime endTime,
    @Default(false) bool isAllDay,
    String? location,
    String? agentId,
    String? originMessageId,
    String? originContext,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CalendarEvent;

  factory CalendarEvent.fromJson(Map<String, dynamic> json) =>
      _$CalendarEventFromJson(json);
}

@freezed
class CalendarEventCreate with _$CalendarEventCreate {
  @JsonSerializable(fieldRename: FieldRename.snake, includeIfNull: false)
  const factory CalendarEventCreate({
    required String title,
    String? description,
    required DateTime startTime,
    required DateTime endTime,
    @Default(false) bool isAllDay,
    String? location,
    String? agentId,
    String? originMessageId,
    String? originContext,
  }) = _CalendarEventCreate;

  factory CalendarEventCreate.fromJson(Map<String, dynamic> json) =>
      _$CalendarEventCreateFromJson(json);
}

@freezed
class CalendarEventUpdate with _$CalendarEventUpdate {
  @JsonSerializable(fieldRename: FieldRename.snake, includeIfNull: false)
  const factory CalendarEventUpdate({
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    bool? isAllDay,
    String? location,
  }) = _CalendarEventUpdate;

  factory CalendarEventUpdate.fromJson(Map<String, dynamic> json) =>
      _$CalendarEventUpdateFromJson(json);
}
