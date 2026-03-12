// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'memory.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Memory _$MemoryFromJson(Map<String, dynamic> json) {
  return _Memory.fromJson(json);
}

/// @nodoc
mixin _$Memory {
  String get id => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  /// Serializes this Memory to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Memory
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MemoryCopyWith<Memory> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MemoryCopyWith<$Res> {
  factory $MemoryCopyWith(Memory value, $Res Function(Memory) then) =
      _$MemoryCopyWithImpl<$Res, Memory>;
  @useResult
  $Res call({String id, String content, String createdAt});
}

/// @nodoc
class _$MemoryCopyWithImpl<$Res, $Val extends Memory>
    implements $MemoryCopyWith<$Res> {
  _$MemoryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Memory
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? content = null,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MemoryImplCopyWith<$Res> implements $MemoryCopyWith<$Res> {
  factory _$$MemoryImplCopyWith(
          _$MemoryImpl value, $Res Function(_$MemoryImpl) then) =
      __$$MemoryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String content, String createdAt});
}

/// @nodoc
class __$$MemoryImplCopyWithImpl<$Res>
    extends _$MemoryCopyWithImpl<$Res, _$MemoryImpl>
    implements _$$MemoryImplCopyWith<$Res> {
  __$$MemoryImplCopyWithImpl(
      _$MemoryImpl _value, $Res Function(_$MemoryImpl) _then)
      : super(_value, _then);

  /// Create a copy of Memory
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? content = null,
    Object? createdAt = null,
  }) {
    return _then(_$MemoryImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

@JsonSerializable(fieldRename: FieldRename.snake)
class _$MemoryImpl implements _Memory {
  const _$MemoryImpl(
      {required this.id, required this.content, required this.createdAt});

  factory _$MemoryImpl.fromJson(Map<String, dynamic> json) =>
      _$$MemoryImplFromJson(json);

  @override
  final String id;
  @override
  final String content;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'Memory(id: $id, content: $content, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MemoryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, content, createdAt);

  /// Create a copy of Memory
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MemoryImplCopyWith<_$MemoryImpl> get copyWith =>
      __$$MemoryImplCopyWithImpl<_$MemoryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MemoryImplToJson(
      this,
    );
  }
}

abstract class _Memory implements Memory {
  const factory _Memory(
      {required final String id,
      required final String content,
      required final String createdAt}) = _$MemoryImpl;

  factory _Memory.fromJson(Map<String, dynamic> json) = _$MemoryImpl.fromJson;

  @override
  String get id;
  @override
  String get content;
  @override
  String get createdAt;

  /// Create a copy of Memory
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MemoryImplCopyWith<_$MemoryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

MemoryGraph _$MemoryGraphFromJson(Map<String, dynamic> json) {
  return _MemoryGraph.fromJson(json);
}

/// @nodoc
mixin _$MemoryGraph {
  List<Memory> get nodes => throw _privateConstructorUsedError;
  List<MemoryEdge> get edges => throw _privateConstructorUsedError;

  /// Serializes this MemoryGraph to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MemoryGraph
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MemoryGraphCopyWith<MemoryGraph> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MemoryGraphCopyWith<$Res> {
  factory $MemoryGraphCopyWith(
          MemoryGraph value, $Res Function(MemoryGraph) then) =
      _$MemoryGraphCopyWithImpl<$Res, MemoryGraph>;
  @useResult
  $Res call({List<Memory> nodes, List<MemoryEdge> edges});
}

/// @nodoc
class _$MemoryGraphCopyWithImpl<$Res, $Val extends MemoryGraph>
    implements $MemoryGraphCopyWith<$Res> {
  _$MemoryGraphCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MemoryGraph
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nodes = null,
    Object? edges = null,
  }) {
    return _then(_value.copyWith(
      nodes: null == nodes
          ? _value.nodes
          : nodes // ignore: cast_nullable_to_non_nullable
              as List<Memory>,
      edges: null == edges
          ? _value.edges
          : edges // ignore: cast_nullable_to_non_nullable
              as List<MemoryEdge>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MemoryGraphImplCopyWith<$Res>
    implements $MemoryGraphCopyWith<$Res> {
  factory _$$MemoryGraphImplCopyWith(
          _$MemoryGraphImpl value, $Res Function(_$MemoryGraphImpl) then) =
      __$$MemoryGraphImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<Memory> nodes, List<MemoryEdge> edges});
}

/// @nodoc
class __$$MemoryGraphImplCopyWithImpl<$Res>
    extends _$MemoryGraphCopyWithImpl<$Res, _$MemoryGraphImpl>
    implements _$$MemoryGraphImplCopyWith<$Res> {
  __$$MemoryGraphImplCopyWithImpl(
      _$MemoryGraphImpl _value, $Res Function(_$MemoryGraphImpl) _then)
      : super(_value, _then);

  /// Create a copy of MemoryGraph
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nodes = null,
    Object? edges = null,
  }) {
    return _then(_$MemoryGraphImpl(
      nodes: null == nodes
          ? _value._nodes
          : nodes // ignore: cast_nullable_to_non_nullable
              as List<Memory>,
      edges: null == edges
          ? _value._edges
          : edges // ignore: cast_nullable_to_non_nullable
              as List<MemoryEdge>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MemoryGraphImpl implements _MemoryGraph {
  const _$MemoryGraphImpl(
      {final List<Memory> nodes = const <Memory>[],
      final List<MemoryEdge> edges = const <MemoryEdge>[]})
      : _nodes = nodes,
        _edges = edges;

  factory _$MemoryGraphImpl.fromJson(Map<String, dynamic> json) =>
      _$$MemoryGraphImplFromJson(json);

  final List<Memory> _nodes;
  @override
  @JsonKey()
  List<Memory> get nodes {
    if (_nodes is EqualUnmodifiableListView) return _nodes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_nodes);
  }

  final List<MemoryEdge> _edges;
  @override
  @JsonKey()
  List<MemoryEdge> get edges {
    if (_edges is EqualUnmodifiableListView) return _edges;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_edges);
  }

  @override
  String toString() {
    return 'MemoryGraph(nodes: $nodes, edges: $edges)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MemoryGraphImpl &&
            const DeepCollectionEquality().equals(other._nodes, _nodes) &&
            const DeepCollectionEquality().equals(other._edges, _edges));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_nodes),
      const DeepCollectionEquality().hash(_edges));

  /// Create a copy of MemoryGraph
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MemoryGraphImplCopyWith<_$MemoryGraphImpl> get copyWith =>
      __$$MemoryGraphImplCopyWithImpl<_$MemoryGraphImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MemoryGraphImplToJson(
      this,
    );
  }
}

abstract class _MemoryGraph implements MemoryGraph {
  const factory _MemoryGraph(
      {final List<Memory> nodes,
      final List<MemoryEdge> edges}) = _$MemoryGraphImpl;

  factory _MemoryGraph.fromJson(Map<String, dynamic> json) =
      _$MemoryGraphImpl.fromJson;

  @override
  List<Memory> get nodes;
  @override
  List<MemoryEdge> get edges;

  /// Create a copy of MemoryGraph
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MemoryGraphImplCopyWith<_$MemoryGraphImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
