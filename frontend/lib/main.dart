import 'package:flutter/material.dart';
import 'design_system/design_system.dart';
import 'chat_page.dart';

void main() {
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
      themeMode: ThemeMode.dark,
      home: const ChatPage(),
    );
  }
}
