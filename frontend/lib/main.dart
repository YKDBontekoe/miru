import 'package:flutter/material.dart';
import 'design_system/design_system.dart';
import 'introduction_page.dart';
import 'backend_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await BackendService.init();
  runApp(const MiruApp());
}

class MiruApp extends StatelessWidget {
  const MiruApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Miru',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: const IntroductionPage(),
    );
  }
}
