// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'agent_info.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Capability _$CapabilityFromJson(Map<String, dynamic> json) {
  return _Capability.fromJson(json);
}

/// @nodoc
mixin _$Capability {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;

  /// Serializes this Capability to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Capability
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CapabilityCopyWith<Capability> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CapabilityCopyWith<$Res> {
  factory $CapabilityCopyWith(
          Capability value, $Res Function(Capability) then) =
      _$CapabilityCopyWithImpl<$Res, Capability>;
  @useResult
  $Res call({String id, String name, String description, String icon});
}

/// @nodoc
class _$CapabilityCopyWithImpl<$Res, $Val extends Capability>
    implements $CapabilityCopyWith<$Res> {
  _$CapabilityCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Capability
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? icon = null,
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
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CapabilityImplCopyWith<$Res>
    implements $CapabilityCopyWith<$Res> {
  factory _$$CapabilityImplCopyWith(
          _$CapabilityImpl value, $Res Function(_$CapabilityImpl) then) =
      __$$CapabilityImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String description, String icon});
}

/// @nodoc
class __$$CapabilityImplCopyWithImpl<$Res>
    extends _$CapabilityCopyWithImpl<$Res, _$CapabilityImpl>
    implements _$$CapabilityImplCopyWith<$Res> {
  __$$CapabilityImplCopyWithImpl(
      _$CapabilityImpl _value, $Res Function(_$CapabilityImpl) _then)
      : super(_value, _then);

  /// Create a copy of Capability
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? icon = null,
  }) {
    return _then(_$CapabilityImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CapabilityImpl implements _Capability {
  const _$CapabilityImpl(
      {required this.id,
      required this.name,
      required this.description,
      required this.icon});

  factory _$CapabilityImpl.fromJson(Map<String, dynamic> json) =>
      _$$CapabilityImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String description;
  @override
  final String icon;

  @override
  String toString() {
    return 'Capability(id: $id, name: $name, description: $description, icon: $icon)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CapabilityImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.icon, icon) || other.icon == icon));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, description, icon);

  /// Create a copy of Capability
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CapabilityImplCopyWith<_$CapabilityImpl> get copyWith =>
      __$$CapabilityImplCopyWithImpl<_$CapabilityImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CapabilityImplToJson(
      this,
    );
  }
}

abstract class _Capability implements Capability {
  const factory _Capability(
      {required final String id,
      required final String name,
      required final String description,
      required final String icon}) = _$CapabilityImpl;

  factory _Capability.fromJson(Map<String, dynamic> json) =
      _$CapabilityImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get description;
  @override
  String get icon;

  /// Create a copy of Capability
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CapabilityImplCopyWith<_$CapabilityImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Integration _$IntegrationFromJson(Map<String, dynamic> json) {
  return _Integration.fromJson(json);
}

/// @nodoc
mixin _$Integration {
  String get type => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;

  /// Serializes this Integration to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Integration
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $IntegrationCopyWith<Integration> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $IntegrationCopyWith<$Res> {
  factory $IntegrationCopyWith(
          Integration value, $Res Function(Integration) then) =
      _$IntegrationCopyWithImpl<$Res, Integration>;
  @useResult
  $Res call(
      {String type,
      String displayName,
      String description,
      String icon,
      String status});
}

/// @nodoc
class _$IntegrationCopyWithImpl<$Res, $Val extends Integration>
    implements $IntegrationCopyWith<$Res> {
  _$IntegrationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Integration
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? displayName = null,
    Object? description = null,
    Object? icon = null,
    Object? status = null,
  }) {
    return _then(_value.copyWith(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$IntegrationImplCopyWith<$Res>
    implements $IntegrationCopyWith<$Res> {
  factory _$$IntegrationImplCopyWith(
          _$IntegrationImpl value, $Res Function(_$IntegrationImpl) then) =
      __$$IntegrationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String type,
      String displayName,
      String description,
      String icon,
      String status});
}

/// @nodoc
class __$$IntegrationImplCopyWithImpl<$Res>
    extends _$IntegrationCopyWithImpl<$Res, _$IntegrationImpl>
    implements _$$IntegrationImplCopyWith<$Res> {
  __$$IntegrationImplCopyWithImpl(
      _$IntegrationImpl _value, $Res Function(_$IntegrationImpl) _then)
      : super(_value, _then);

  /// Create a copy of Integration
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? displayName = null,
    Object? description = null,
    Object? icon = null,
    Object? status = null,
  }) {
    return _then(_$IntegrationImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

@JsonSerializable(fieldRename: FieldRename.snake)
class _$IntegrationImpl implements _Integration {
  const _$IntegrationImpl(
      {required this.type,
      required this.displayName,
      required this.description,
      required this.icon,
      required this.status});

  factory _$IntegrationImpl.fromJson(Map<String, dynamic> json) =>
      _$$IntegrationImplFromJson(json);

  @override
  final String type;
  @override
  final String displayName;
  @override
  final String description;
  @override
  final String icon;
  @override
  final String status;

  @override
  String toString() {
    return 'Integration(type: $type, displayName: $displayName, description: $description, icon: $icon, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$IntegrationImpl &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.icon, icon) || other.icon == icon) &&
            (identical(other.status, status) || other.status == status));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, type, displayName, description, icon, status);

  /// Create a copy of Integration
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$IntegrationImplCopyWith<_$IntegrationImpl> get copyWith =>
      __$$IntegrationImplCopyWithImpl<_$IntegrationImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$IntegrationImplToJson(
      this,
    );
  }
}

abstract class _Integration implements Integration {
  const factory _Integration(
      {required final String type,
      required final String displayName,
      required final String description,
      required final String icon,
      required final String status}) = _$IntegrationImpl;

  factory _Integration.fromJson(Map<String, dynamic> json) =
      _$IntegrationImpl.fromJson;

  @override
  String get type;
  @override
  String get displayName;
  @override
  String get description;
  @override
  String get icon;
  @override
  String get status;

  /// Create a copy of Integration
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$IntegrationImplCopyWith<_$IntegrationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AgentGenerationResponse _$AgentGenerationResponseFromJson(
    Map<String, dynamic> json) {
  return _AgentGenerationResponse.fromJson(json);
}

/// @nodoc
mixin _$AgentGenerationResponse {
  String get name => throw _privateConstructorUsedError;
  String get personality => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  List<String> get goals => throw _privateConstructorUsedError;
  List<String> get capabilities => throw _privateConstructorUsedError;
  List<String> get suggestedIntegrations => throw _privateConstructorUsedError;

  /// Serializes this AgentGenerationResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AgentGenerationResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AgentGenerationResponseCopyWith<AgentGenerationResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AgentGenerationResponseCopyWith<$Res> {
  factory $AgentGenerationResponseCopyWith(AgentGenerationResponse value,
          $Res Function(AgentGenerationResponse) then) =
      _$AgentGenerationResponseCopyWithImpl<$Res, AgentGenerationResponse>;
  @useResult
  $Res call(
      {String name,
      String personality,
      String description,
      List<String> goals,
      List<String> capabilities,
      List<String> suggestedIntegrations});
}

/// @nodoc
class _$AgentGenerationResponseCopyWithImpl<$Res,
        $Val extends AgentGenerationResponse>
    implements $AgentGenerationResponseCopyWith<$Res> {
  _$AgentGenerationResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AgentGenerationResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? personality = null,
    Object? description = null,
    Object? goals = null,
    Object? capabilities = null,
    Object? suggestedIntegrations = null,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      personality: null == personality
          ? _value.personality
          : personality // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      goals: null == goals
          ? _value.goals
          : goals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      capabilities: null == capabilities
          ? _value.capabilities
          : capabilities // ignore: cast_nullable_to_non_nullable
              as List<String>,
      suggestedIntegrations: null == suggestedIntegrations
          ? _value.suggestedIntegrations
          : suggestedIntegrations // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AgentGenerationResponseImplCopyWith<$Res>
    implements $AgentGenerationResponseCopyWith<$Res> {
  factory _$$AgentGenerationResponseImplCopyWith(
          _$AgentGenerationResponseImpl value,
          $Res Function(_$AgentGenerationResponseImpl) then) =
      __$$AgentGenerationResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String name,
      String personality,
      String description,
      List<String> goals,
      List<String> capabilities,
      List<String> suggestedIntegrations});
}

/// @nodoc
class __$$AgentGenerationResponseImplCopyWithImpl<$Res>
    extends _$AgentGenerationResponseCopyWithImpl<$Res,
        _$AgentGenerationResponseImpl>
    implements _$$AgentGenerationResponseImplCopyWith<$Res> {
  __$$AgentGenerationResponseImplCopyWithImpl(
      _$AgentGenerationResponseImpl _value,
      $Res Function(_$AgentGenerationResponseImpl) _then)
      : super(_value, _then);

  /// Create a copy of AgentGenerationResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? personality = null,
    Object? description = null,
    Object? goals = null,
    Object? capabilities = null,
    Object? suggestedIntegrations = null,
  }) {
    return _then(_$AgentGenerationResponseImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      personality: null == personality
          ? _value.personality
          : personality // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      goals: null == goals
          ? _value._goals
          : goals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      capabilities: null == capabilities
          ? _value._capabilities
          : capabilities // ignore: cast_nullable_to_non_nullable
              as List<String>,
      suggestedIntegrations: null == suggestedIntegrations
          ? _value._suggestedIntegrations
          : suggestedIntegrations // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc

@JsonSerializable(fieldRename: FieldRename.snake)
class _$AgentGenerationResponseImpl implements _AgentGenerationResponse {
  const _$AgentGenerationResponseImpl(
      {required this.name,
      required this.personality,
      required this.description,
      required final List<String> goals,
      required final List<String> capabilities,
      required final List<String> suggestedIntegrations})
      : _goals = goals,
        _capabilities = capabilities,
        _suggestedIntegrations = suggestedIntegrations;

  factory _$AgentGenerationResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$AgentGenerationResponseImplFromJson(json);

  @override
  final String name;
  @override
  final String personality;
  @override
  final String description;
  final List<String> _goals;
  @override
  List<String> get goals {
    if (_goals is EqualUnmodifiableListView) return _goals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_goals);
  }

  final List<String> _capabilities;
  @override
  List<String> get capabilities {
    if (_capabilities is EqualUnmodifiableListView) return _capabilities;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_capabilities);
  }

  final List<String> _suggestedIntegrations;
  @override
  List<String> get suggestedIntegrations {
    if (_suggestedIntegrations is EqualUnmodifiableListView)
      return _suggestedIntegrations;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_suggestedIntegrations);
  }

  @override
  String toString() {
    return 'AgentGenerationResponse(name: $name, personality: $personality, description: $description, goals: $goals, capabilities: $capabilities, suggestedIntegrations: $suggestedIntegrations)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AgentGenerationResponseImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.personality, personality) ||
                other.personality == personality) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality().equals(other._goals, _goals) &&
            const DeepCollectionEquality()
                .equals(other._capabilities, _capabilities) &&
            const DeepCollectionEquality()
                .equals(other._suggestedIntegrations, _suggestedIntegrations));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      name,
      personality,
      description,
      const DeepCollectionEquality().hash(_goals),
      const DeepCollectionEquality().hash(_capabilities),
      const DeepCollectionEquality().hash(_suggestedIntegrations));

  /// Create a copy of AgentGenerationResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AgentGenerationResponseImplCopyWith<_$AgentGenerationResponseImpl>
      get copyWith => __$$AgentGenerationResponseImplCopyWithImpl<
          _$AgentGenerationResponseImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AgentGenerationResponseImplToJson(
      this,
    );
  }
}

abstract class _AgentGenerationResponse implements AgentGenerationResponse {
  const factory _AgentGenerationResponse(
          {required final String name,
          required final String personality,
          required final String description,
          required final List<String> goals,
          required final List<String> capabilities,
          required final List<String> suggestedIntegrations}) =
      _$AgentGenerationResponseImpl;

  factory _AgentGenerationResponse.fromJson(Map<String, dynamic> json) =
      _$AgentGenerationResponseImpl.fromJson;

  @override
  String get name;
  @override
  String get personality;
  @override
  String get description;
  @override
  List<String> get goals;
  @override
  List<String> get capabilities;
  @override
  List<String> get suggestedIntegrations;

  /// Create a copy of AgentGenerationResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AgentGenerationResponseImplCopyWith<_$AgentGenerationResponseImpl>
      get copyWith => throw _privateConstructorUsedError;
}
