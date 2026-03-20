import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:file_picker/file_picker.dart';
import 'package:miru/core/design_system/design_system.dart';

void main() {
  testWidgets('ChatInputBar renders attachments correctly', (
    WidgetTester tester,
  ) async {
    final controller = TextEditingController();
    int removeCallCount = 0;
    int attachCallCount = 0;

    final fakeFiles = [
      PlatformFile(name: 'document1.pdf', size: 1024),
      PlatformFile(name: 'image.jpg', size: 2048),
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: ChatInputBar(
            controller: controller,
            onSend: () {},
            onAttachmentPressed: () {
              attachCallCount++;
            },
            attachedFiles: fakeFiles,
            onRemoveAttachment: (file) {
              removeCallCount++;
            },
          ),
        ),
      ),
    );

    // Verify attachment button is present
    expect(find.byIcon(Icons.attach_file_rounded), findsOneWidget);

    // Tap attachment button
    await tester.tap(find.byIcon(Icons.attach_file_rounded));
    expect(attachCallCount, 1);

    // Verify files are displayed
    expect(find.text('document1.pdf'), findsOneWidget);
    expect(find.text('image.jpg'), findsOneWidget);

    // Verify remove buttons exist (one for each file)
    expect(find.byIcon(Icons.close_rounded), findsNWidgets(2));

    // Tap to remove the first file
    await tester.tap(find.byIcon(Icons.close_rounded).first);
    expect(removeCallCount, 1);
  });
}
