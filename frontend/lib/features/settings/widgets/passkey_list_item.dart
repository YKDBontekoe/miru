import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/services/passkey_service.dart';
import 'package:miru/core/utils/date_utils.dart';

/// A list tile widget displaying registered passkeys.
class PasskeyListItem extends StatelessWidget {
  final PasskeyInfo passkey;
  final VoidCallback onDelete;

  const PasskeyListItem({
    super.key,
    required this.passkey,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return ListTile(
      leading: Icon(
        Icons.fingerprint_rounded,
        color: colors.onSurfaceMuted,
        size: AppSpacing.iconMd,
      ),
      title: Text(
        passkey.deviceName ?? 'Passkey',
        style: AppTypography.labelLarge.copyWith(color: colors.onSurface),
      ),
      subtitle: Text(
        'Added ${AppDateUtils.formatDate(passkey.createdAt)}',
        style: AppTypography.bodySmall.copyWith(color: colors.onSurfaceMuted),
      ),
      trailing: IconButton(
        icon: Icon(
          Icons.delete_outline_rounded,
          color: AppColors.error,
          size: 20,
        ),
        onPressed: onDelete,
        tooltip: 'Remove passkey',
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
    );
  }
}
