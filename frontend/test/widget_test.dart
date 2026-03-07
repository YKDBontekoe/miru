import 'package:flutter_test/flutter_test.dart';
import 'package:miru/main.dart';

void main() {
  testWidgets('Miru app renders chat page', (WidgetTester tester) async {
    await tester.pumpWidget(const MiruApp());
    expect(find.textContaining('Miru'), findsWidgets);
  });
}
