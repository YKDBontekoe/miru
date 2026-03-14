import 'package:freezed_annotation/freezed_annotation.dart';

part 'agent_info.freezed.dart';
part 'agent_info.g.dart';

@freezed
class Capability with _$Capability {
  const factory Capability({
    required String id,
    required String name,
    required String description,
    required String icon,
  }) = _Capability;

  factory Capability.fromJson(Map<String, dynamic> json) =>
      _$CapabilityFromJson(json);
}

@freezed
class Integration with _$Integration {
  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory Integration({
    required String id,
    required String displayName,
    required String description,
    required String icon,
    required String status,
  }) = _Integration;

  factory Integration.fromJson(Map<String, dynamic> json) =>
      _$IntegrationFromJson(json);
}

@freezed
class AgentGenerationResponse with _$AgentGenerationResponse {
  @JsonSerializable(fieldRename: FieldRename.snake)
  const factory AgentGenerationResponse({
    required String name,
    required String personality,
    required String description,
    required List<String> goals,
    required List<String> capabilities,
    required List<String> suggestedIntegrations,
  }) = _AgentGenerationResponse;

  factory AgentGenerationResponse.fromJson(Map<String, dynamic> json) =>
      _$AgentGenerationResponseFromJson(json);
}
