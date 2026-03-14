with open('frontend/integration_test/smoke_test.dart', 'r') as f:
    content = f.read()

# Replace simple snackbar asserts with logging asserts
old_snackbar = "expect(find.byType(SnackBar), findsNothing);"
new_snackbar = """
      final snackbars = find.byType(SnackBar).evaluate();
      for (final e in snackbars) {
        final snackbar = e.widget as SnackBar;
        final textWidget = snackbar.content as Text;
        debugPrint('UNEXPECTED SNACKBAR FOUND: ${textWidget.data}');
      }
      expect(snackbars, isEmpty);
"""
content = content.replace(old_snackbar, new_snackbar)

# Add explicit expects before taps so we get widget trees on failure
old_toggle = "final toggleButton = find.text('Sign in with password instead');"
new_toggle = "final toggleButton = find.text('Sign in with password instead');\n      expect(toggleButton, findsOneWidget, reason: 'toggleButton not found. Widget tree will be dumped.');"
content = content.replace(old_toggle, new_toggle)

old_save = "final saveButton = find.text('Save Persona');"
new_save = "final saveButton = find.text('Save Persona');\n      expect(saveButton, findsOneWidget, reason: 'saveButton not found. Widget tree will be dumped.');"
content = content.replace(old_save, new_save)

old_settings = "final settingsButton = find.byWidgetPredicate("
new_settings = "final settingsButton = find.byWidgetPredicate(\n          (widget) => widget is Icon && widget.icon == Icons.settings_outlined);\n      expect(settingsButton, findsOneWidget, reason: 'settingsButton not found');\n      final unused = find.byWidgetPredicate("
content = content.replace(old_settings, new_settings)
content = content.replace("final unused = find.byWidgetPredicate(\n          (widget) => widget is Icon && widget.icon == Icons.settings_outlined);", "")

with open('frontend/integration_test/smoke_test.dart', 'w') as f:
    f.write(content)
