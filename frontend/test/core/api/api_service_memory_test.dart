import 'package:flutter_test/flutter_test.dart';
import 'package:miru/core/models/memory.dart';

void main() {
  group('Memory Models', () {
    test('MemoryCollection.fromJson parses correctly', () {
      final json = {
        'id': 'col-123',
        'name': 'Test Col',
        'description': 'A collection',
        'createdAt': '2023-10-01T12:00:00.000Z',
        'updatedAt': '2023-10-01T12:00:00.000Z',
      };

      final col = MemoryCollection.fromJson(json);
      expect(col.id, 'col-123');
      expect(col.name, 'Test Col');
      expect(col.description, 'A collection');
    });

    test('Memory.fromJson parses new fields correctly', () {
      final json = {
        'id': 'mem-123',
        'content': 'Test memory',
        'created_at': '2023-10-01T12:00:00.000Z',
        'collection_id': 'col-123',
      };

      final mem = Memory.fromJson(json);
      expect(mem.id, 'mem-123');
      expect(mem.content, 'Test memory');
      expect(mem.collectionId, 'col-123');
    });
  });
}
