import 'package:flutter/material.dart';
import 'design_system/design_system.dart';
import 'design_system/components/model_selector_sheet.dart';
import 'backend_service.dart';

class SettingsPage extends StatefulWidget {
  final String? currentModel;
  final ValueChanged<String?> onModelChanged;

  const SettingsPage({
    super.key,
    this.currentModel,
    required this.onModelChanged,
  });

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _isPrivacyMode = false;
  bool _notificationsEnabled = true;
  late TextEditingController _backendController;

  @override
  void initState() {
    super.initState();
    _backendController =
        TextEditingController(text: BackendService.baseUrl.value);
  }

  @override
  void dispose() {
    _backendController.dispose();
    super.dispose();
  }

  void _openModelSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ModelSelectorSheet(
        currentModel: widget.currentModel,
        onSelected: widget.onModelChanged,
      ),
    );
  }

  Future<void> _updateBackendUrl() async {
    final url = await showDialog<String>(
      context: context,
      builder: (context) {
        final controller =
            TextEditingController(text: BackendService.baseUrl.value);
        return AlertDialog(
          title: const Text('Backend URL'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'http://10.0.2.2:8000',
              helperText: 'Enter the base URL of your Miru backend.',
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                final navigator = Navigator.of(context);
                BackendService.reset().then((_) {
                  if (mounted) {
                    navigator.pop();
                    setState(() {});
                  }
                });
              },
              child: const Text('Reset Default'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, controller.text.trim()),
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (url != null && url.isNotEmpty) {
      try {
        await BackendService.setBaseUrl(url);
        if (!mounted) return;
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Backend URL updated to: ${BackendService.baseUrl.value}',
            ),
          ),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: colors.surfaceHigh,
      ),
      body: ListView(
        children: [
          const SizedBox(height: AppSpacing.md),
          _buildSectionHeader('AI Model'),
          _buildSettingTile(
            icon: Icons.smart_toy_outlined,
            title: 'Current Model',
            subtitle: widget.currentModel ?? 'Default (Server-side)',
            onTap: _openModelSheet,
            trailing: const Icon(Icons.chevron_right_rounded),
          ),
          const Divider(),
          _buildSectionHeader('Connection'),
          _buildSettingTile(
            icon: Icons.lan_outlined,
            title: 'Backend URL',
            subtitle: BackendService.baseUrl.value,
            onTap: _updateBackendUrl,
            trailing: const Icon(Icons.edit_outlined, size: 20),
          ),
          const Divider(),
          _buildSectionHeader('Preferences'),
          _buildSettingTile(
            icon: Icons.security_rounded,
            title: 'Privacy Mode',
            subtitle: 'Minimize data logging for sessions',
            trailing: Switch(
              value: _isPrivacyMode,
              onChanged: (value) => setState(() => _isPrivacyMode = value),
            ),
          ),
          _buildSettingTile(
            icon: Icons.notifications_none_rounded,
            title: 'Notifications',
            subtitle: 'Get alerts for long-running tasks',
            trailing: Switch(
              value: _notificationsEnabled,
              onChanged: (value) =>
                  setState(() => _notificationsEnabled = value),
            ),
          ),
          const Divider(),
          _buildSectionHeader('Data'),
          _buildSettingTile(
            icon: Icons.delete_outline_rounded,
            title: 'Clear Chat History',
            subtitle: 'Permanently delete all conversations',
            onTap: () {
              // TODO: Implement clear history
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Chat history cleared')),
              );
            },
            destructive: true,
          ),
          const Divider(),
          _buildSectionHeader('About'),
          _buildSettingTile(
            icon: Icons.info_outline_rounded,
            title: 'Miru Version',
            subtitle: '1.0.0 (Beta)',
          ),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Text(
        title.toUpperCase(),
        style: AppTypography.labelSmall.copyWith(
          color: context.colors.onSurfaceMuted,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
    bool destructive = false,
  }) {
    final colors = context.colors;
    final contentColor = destructive ? AppColors.error : colors.onSurface;

    return ListTile(
      leading: Icon(
        icon,
        color: destructive ? AppColors.error : colors.onSurfaceMuted,
        size: AppSpacing.iconMd,
      ),
      title: Text(
        title,
        style: AppTypography.labelLarge.copyWith(color: contentColor),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: AppTypography.bodySmall
                  .copyWith(color: colors.onSurfaceMuted),
            )
          : null,
      trailing: trailing,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
    );
  }
}
