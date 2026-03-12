// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'agent.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Agent _$AgentFromJson(Map<String, dynamic> json) {
  return _Agent.fromJson(json);
}

/// @nodoc
mixin _$Agent {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get personality => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  List<String> get goals => throw _privateConstructorUsedError;
  List<String> get capabilities => throw _privateConstructorUsedError;
  List<String> get integrations => throw _privateConstructorUsedError;
  Map<String, dynamic> get integrationConfigs =>
      throw _privateConstructorUsedError;
  String? get systemPrompt => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get mood => throw _privateConstructorUsedError;
  int get messageCount => throw _privateConstructorUsedError;
  String? get avatarUrl => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this Agent to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Agent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AgentCopyWith<Agent> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AgentCopyWith<$Res> {
  factory $AgentCopyWith(Agent value, $Res Function(Agent) then) =
      _$AgentCopyWithImpl<$Res, Agent>;
  @useResult
  $Res call(
      {String id,
      String name,
      String personality,
      String? description,
      List<String> goals,
      List<String> capabilities,
      List<String> integrations,
      Map<String, dynamic> integrationConfigs,
      String? systemPrompt,
      String status,
      String mood,
      int messageCount,
      String? avatarUrl,
      String createdAt});
}

/// @nodoc
class _$AgentCopyWithImpl<$Res, $Val extends Agent>
    implements $AgentCopyWith<$Res> {
  _$AgentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Agent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? personality = null,
    Object? description = freezed,
    Object? goals = null,
    Object? capabilities = null,
    Object? integrations = null,
    Object? integrationConfigs = null,
    Object? systemPrompt = freezed,
    Object? status = null,
    Object? mood = null,
    Object? messageCount = null,
    Object? avatarUrl = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      personality: null == personality
          ? _value.personality
          : personality // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      goals: null == goals
          ? _value.goals
          : goals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      capabilities: null == capabilities
          ? _value.capabilities
          : capabilities // ignore: cast_nullable_to_non_nullable
              as List<String>,
      integrations: null == integrations
          ? _value.integrations
          : integrations // ignore: cast_nullable_to_non_nullable
              as List<String>,
      integrationConfigs: null == integrationConfigs
          ? _value.integrationConfigs
          : integrationConfigs // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      systemPrompt: freezed == systemPrompt
          ? _value.systemPrompt
          : systemPrompt // ignore: cast_nullable_to_non_nullable
              as String?,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      mood: null == mood
          ? _value.mood
          : mood // ignore: cast_nullable_to_non_nullable
              as String,
      messageCount: null == messageCount
          ? _value.messageCount
          : messageCount // ignore: cast_nullable_to_non_nullable
              as int,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AgentImplCopyWith<$Res> implements $AgentCopyWith<$Res> {
  factory _$$AgentImplCopyWith(
          _$AgentImpl value, $Res Function(_$AgentImpl) then) =
      __$$AgentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String personality,
      String? description,
      List<String> goals,
      List<String> capabilities,
      List<String> integrations,
      Map<String, dynamic> integrationConfigs,
      String? systemPrompt,
      String status,
      String mood,
      int messageCount,
      String? avatarUrl,
      String createdAt});
}

/// @nodoc
class __$$AgentImplCopyWithImpl<$Res>
    extends _$AgentCopyWithImpl<$Res, _$AgentImpl>
    implements _$$AgentImplCopyWith<$Res> {
  __$$AgentImplCopyWithImpl(
      _$AgentImpl _value, $Res Function(_$AgentImpl) _then)
      : super(_value, _then);

  /// Create a copy of Agent
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? personality = null,
    Object? description = freezed,
    Object? goals = null,
    Object? capabilities = null,
    Object? integrations = null,
    Object? integrationConfigs = null,
    Object? systemPrompt = freezed,
    Object? status = null,
    Object? mood = null,
    Object? messageCount = null,
    Object? avatarUrl = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$AgentImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      personality: null == personality
          ? _value.personality
          : personality // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      goals: null == goals
          ? _value._goals
          : goals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      capabilities: null == capabilities
          ? _value._capabilities
          : capabilities // ignore: cast_nullable_to_non_nullable
              as List<String>,
      integrations: null == integrations
          ? _value._integrations
          : integrations // ignore: cast_nullable_to_non_nullable
              as List<String>,
      integrationConfigs: null == integrationConfigs
          ? _value._integrationConfigs
          : integrationConfigs // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      systemPrompt: freezed == systemPrompt
          ? _value.systemPrompt
          : systemPrompt // ignore: cast_nullable_to_non_nullable
              as String?,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      mood: null == mood
          ? _value.mood
          : mood // ignore: cast_nullable_to_non_nullable
              as String,
      messageCount: null == messageCount
          ? _value.messageCount
          : messageCount // ignore: cast_nullable_to_non_nullable
              as int,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

@JsonSerializable(fieldRename: FieldRename.snake)
class _$AgentImpl extends _Agent {
  const _$AgentImpl(
      {required this.id,
      required this.name,
      required this.personality,
      this.description,
      final List<String> goals = const <String>[],
      final List<String> capabilities = const <String>[],
      final List<String> integrations = const <String>[],
      final Map<String, dynamic> integrationConfigs = const <String, dynamic>{},
      this.systemPrompt,
      this.status = 'active',
      this.mood = 'Neutral',
      this.messageCount = 0,
      this.avatarUrl,
      required this.createdAt})
      : _goals = goals,
        _capabilities = capabilities,
        _integrations = integrations,
        _integrationConfigs = integrationConfigs,
        super._();

  factory _$AgentImpl.fromJson(Map<String, dynamic> json) =>
      _$$AgentImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String personality;
  @override
  final String? description;
  final List<String> _goals;
  @override
  @JsonKey()
  List<String> get goals {
    if (_goals is EqualUnmodifiableListView) return _goals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_goals);
  }

  final List<String> _capabilities;
  @override
  @JsonKey()
  List<String> get capabilities {
    if (_capabilities is EqualUnmodifiableListView) return _capabilities;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_capabilities);
  }

  final List<String> _integrations;
  @override
  @JsonKey()
  List<String> get integrations {
    if (_integrations is EqualUnmodifiableListView) return _integrations;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_integrations);
  }

  final Map<String, dynamic> _integrationConfigs;
  @override
  @JsonKey()
  Map<String, dynamic> get integrationConfigs {
    if (_integrationConfigs is EqualUnmodifiableMapView)
      return _integrationConfigs;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_integrationConfigs);
  }

  @override
  final String? systemPrompt;
  @override
  @JsonKey()
  final String status;
  @override
  @JsonKey()
  final String mood;
  @override
  @JsonKey()
  final int messageCount;
  @override
  final String? avatarUrl;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'Agent(id: $id, name: $name, personality: $personality, description: $description, goals: $goals, capabilities: $capabilities, integrations: $integrations, integrationConfigs: $integrationConfigs, systemPrompt: $systemPrompt, status: $status, mood: $mood, messageCount: $messageCount, avatarUrl: $avatarUrl, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AgentImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.personality, personality) ||
                other.personality == personality) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._goals, _goals) &&
            const DeepCollectionEquality()
                .equals(other._capabilities, _capabilities) &&
            const DeepCollectionEquality()
                .equals(other._integrations, _integrations) &&
            const DeepCollectionEquality()
                .equals(other._integrationConfigs, _integrationConfigs) &&
            (identical(other.systemPrompt, systemPrompt) ||
                other.systemPrompt == systemPrompt) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.mood, mood) || other.mood == mood) &&
            (identical(other.messageCount, messageCount) ||
                other.messageCount == messageCount) &&
            (identical(other.avatarUrl, avatarUrl) ||
                other.avatarUrl == avatarUrl) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      name,
      personality,
      description,
      const DeepCollectionEquality().hash(_goals),
      const DeepCollectionEquality().hash(_capabilities),
      const DeepCollectionEquality().hash(_integrations),
      const DeepCollectionEquality().hash(_integrationConfigs),
      systemPrompt,
      status,
      mood,
      messageCount,
      avatarUrl,
      createdAt);

  /// Create a copy of Agent
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AgentImplCopyWith<_$AgentImpl> get copyWith =>
      __$$AgentImplCopyWithImpl<_$AgentImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AgentImplToJson(
      this,
    );
  }
}

abstract class _Agent extends Agent {
  const factory _Agent(
      {required final String id,
      required final String name,
      required final String personality,
      final String? description,
      final List<String> goals,
      final List<String> capabilities,
      final List<String> integrations,
      final Map<String, dynamic> integrationConfigs,
      final String? systemPrompt,
      final String status,
      final String mood,
      final int messageCount,
      final String? avatarUrl,
      required final String createdAt}) = _$AgentImpl;
  const _Agent._() : super._();

  factory _Agent.fromJson(Map<String, dynamic> json) = _$AgentImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get personality;
  @override
  String? get description;
  @override
  List<String> get goals;
  @override
  List<String> get capabilities;
  @override
  List<String> get integrations;
  @override
  Map<String, dynamic> get integrationConfigs;
  @override
  String? get systemPrompt;
  @override
  String get status;
  @override
  String get mood;
  @override
  int get messageCount;
  @override
  String? get avatarUrl;
  @override
  String get createdAt;

  /// Create a copy of Agent
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AgentImplCopyWith<_$AgentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
