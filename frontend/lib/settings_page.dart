import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:credential_manager/credential_manager.dart';

import 'design_system/design_system.dart';
import 'services/passkey_service.dart';
import 'services/supabase_service.dart';

class SettingsPage extends StatefulWidget {
  /// Called when the user clears chat history from settings.
  final VoidCallback? onClearHistory;

  const SettingsPage({super.key, this.onClearHistory});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _isPrivacyMode = false;
  bool _notificationsEnabled = true;

  // Passkey management state
  List<PasskeyInfo> _passkeys = [];
  bool _loadingPasskeys = false;
  bool _addingPasskey = false;

  @override
  void initState() {
    super.initState();
    _loadPasskeys();
  }

  // ---------------------------------------------------------------------------
  // Passkey management
  // ---------------------------------------------------------------------------

  Future<void> _loadPasskeys() async {
    if (!SupabaseService.isAuthenticated) return;
    setState(() => _loadingPasskeys = true);
    try {
      final passkeys = await PasskeyService.listPasskeys();
      if (mounted) setState(() => _passkeys = passkeys);
    } catch (e) {
      // Non-fatal — user may not have any passkeys yet.
    } finally {
      if (mounted) setState(() => _loadingPasskeys = false);
    }
  }

  Future<void> _addPasskey() async {
    setState(() => _addingPasskey = true);
    try {
      // Step 1: Get registration options from the backend.
      final optionsData = await PasskeyService.getRegistrationOptions(
        deviceName: _getDeviceLabel(),
      );
      final challengeId = optionsData['challenge_id'] as String;
      final options = optionsData['options'] as Map<String, dynamic>;

      // Step 2: Create credential via platform API.
      final credentialJson = await PasskeyService.platformCreateCredential(
        options,
      );

      // Step 3: Verify with the backend.
      await PasskeyService.verifyRegistration(
        challengeId: challengeId,
        credentialJson: credentialJson,
        deviceName: _getDeviceLabel(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passkey registered successfully')),
      );
      await _loadPasskeys();
    } on CredentialException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add passkey: ${e.message}')),
      );
    } on PasskeyException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add passkey: ${e.detail}')),
      );
    } on UnsupportedError catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message ?? 'Passkeys not supported on this device'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _addingPasskey = false);
    }
  }

  Future<void> _deletePasskey(PasskeyInfo passkey) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove passkey'),
        content: Text(
          'Remove "${passkey.deviceName ?? 'this passkey'}"?\n\n'
          'You will no longer be able to sign in with it.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await PasskeyService.deletePasskey(passkey.id);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Passkey removed')));
      await _loadPasskeys();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to remove: $e')));
    }
  }

  String _getDeviceLabel() {
    // A simple heuristic — apps can improve this with device_info_plus.
    return 'My device';
  }

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out'),
        content: const Text('You will need to sign in again to access Miru.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await SupabaseService.signOut();
    // main.dart StreamBuilder will detect the auth-state change and navigate
    // back to AuthPage automatically.
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final user = SupabaseService.currentUser;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: colors.surfaceHigh,
      ),
      body: ListView(
        children: [
          // Account section
          if (user != null) ...[
            const SizedBox(height: AppSpacing.md),
            _buildSectionHeader('Account'),
            ListTile(
              leading: Icon(
                Icons.person_outline_rounded,
                color: colors.onSurfaceMuted,
                size: AppSpacing.iconMd,
              ),
              title: Text(
                user.email ?? 'Signed in',
                style: AppTypography.labelLarge.copyWith(
                  color: colors.onSurface,
                ),
              ),
              subtitle: Text(
                'Signed in',
                style: AppTypography.bodySmall.copyWith(
                  color: colors.onSurfaceMuted,
                ),
              ),
            ),
            _buildSettingTile(
              icon: Icons.logout_rounded,
              title: 'Sign out',
              subtitle: 'Sign out of your Miru account',
              onTap: _signOut,
              destructive: true,
            ),
          ],

          // Passkeys section
          const Divider(),
          _buildSectionHeader('Passkeys'),
          if (_loadingPasskeys)
            const Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else ...[
            // List existing passkeys
            ..._passkeys.map(
              (passkey) => ListTile(
                leading: Icon(
                  Icons.fingerprint_rounded,
                  color: colors.onSurfaceMuted,
                  size: AppSpacing.iconMd,
                ),
                title: Text(
                  passkey.deviceName ?? 'Passkey',
                  style: AppTypography.labelLarge.copyWith(
                    color: colors.onSurface,
                  ),
                ),
                subtitle: Text(
                  'Added ${_formatDate(passkey.createdAt)}',
                  style: AppTypography.bodySmall.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
                trailing: IconButton(
                  icon: Icon(
                    Icons.delete_outline_rounded,
                    color: AppColors.error,
                    size: 20,
                  ),
                  onPressed: () => _deletePasskey(passkey),
                  tooltip: 'Remove passkey',
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.xs,
                ),
              ),
            ),
            if (_passkeys.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                child: Text(
                  'No passkeys registered. Add one to sign in faster with biometrics.',
                  style: AppTypography.bodySmall.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ),
            // Add passkey button
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: OutlinedButton.icon(
                onPressed: _addingPasskey ? null : _addPasskey,
                icon: _addingPasskey
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.add_rounded),
                label: const Text('Add passkey'),
              ),
            ),
          ],

          // Preferences
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

          // Data
          const Divider(),
          _buildSectionHeader('Data'),
          _buildSettingTile(
            icon: Icons.delete_outline_rounded,
            title: 'Clear Chat History',
            subtitle: 'Permanently delete all conversations',
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Clear Chat History'),
                  content: const Text(
                    'This will permanently delete all conversations. '
                    'This action cannot be undone.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                      ),
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Clear'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('miru_chat_messages');
                widget.onClearHistory?.call();
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Chat history cleared')),
                );
              }
            },
            destructive: true,
          ),

          // About
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate).toLocal();
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return isoDate;
    }
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
              style: AppTypography.bodySmall.copyWith(
                color: colors.onSurfaceMuted,
              ),
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
