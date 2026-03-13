import re

with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Replace the assertion for rooms since we missed adding the assertions there in the previous file. Wait, I see it in test 4?
# Let's ensure it's there.
old_rooms_end = """      // Wait for bottom sheet to close and list to reload
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // We should be back on the Rooms page, but it might just be the chat view.
      // Rooms view should show the created agent in the list.
    });"""

new_rooms_end = """      // Wait for bottom sheet to close and list to reload
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // We should be back on the Rooms page, but it might just be the chat view.
      // Rooms view should show the created agent in the list.

      // Assert no errors occurred during navigation or saving
      expect(find.byType(SnackBar), findsNothing);
      expect(find.textContaining('Error'), findsNothing);
    });"""

content = content.replace(old_rooms_end, new_rooms_end)

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
