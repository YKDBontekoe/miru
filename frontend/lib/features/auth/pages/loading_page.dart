import 'package:flutter/material.dart';

import 'package:miru/core/api/backend_service.dart';
import 'package:miru/core/design_system/design_system.dart';

class LoadingPage extends StatefulWidget {
  final Widget child;

  const LoadingPage({super.key, required this.child});

  @override
  State<LoadingPage> createState() => _LoadingPageState();
}

class _LoadingPageState extends State<LoadingPage> {
  late Future<void> _initFuture;
  bool _isRetrying = false;

  @override
  void initState() {
    super.initState();
    _initFuture = _waitForBackend();
  }

  Future<void> _waitForBackend() async {
    // Wait for the backend /health endpoint to return 200
    await BackendService.waitForBackend(maxAttempts: 30);
  }

  void _retry() {
    setState(() {
      _isRetrying = true;
      _initFuture = _waitForBackend().whenComplete(() {
        if (mounted) {
          setState(() {
            _isRetrying = false;
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildLoadingScreen(context);
        }

        if (snapshot.hasError) {
          return _buildErrorScreen(context, snapshot.error);
        }

        return widget.child;
      },
    );
  }

  Widget _buildLoadingScreen(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.surface,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: AppSpacing.iconXl,
              height: AppSpacing.iconXl,
              child: CircularProgressIndicator(
                color: colors.primary,
                strokeWidth: 3,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Waking up server...',
              style: AppTypography.headingMedium.copyWith(
                color: colors.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'This might take up to a minute due to cold start.',
              style: AppTypography.bodyMedium.copyWith(
                color: colors.onSurfaceMuted,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorScreen(BuildContext context, Object? error) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.surface,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.cloud_off_rounded, size: 64, color: colors.error),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Failed to connect to server',
                style: AppTypography.headingLarge.copyWith(
                  color: colors.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'The server might be down or unreachable.\nPlease check your connection and try again.',
                style: AppTypography.bodyMedium.copyWith(
                  color: colors.onSurfaceMuted,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xxl),
              ElevatedButton.icon(
                onPressed: _isRetrying ? null : _retry,
                icon: _isRetrying
                    ? const SizedBox(
                        width: AppSpacing.iconSm,
                        height: AppSpacing.iconSm,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.refresh_rounded),
                label: Text(_isRetrying ? 'Retrying...' : 'Retry Connection'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.primary,
                  foregroundColor: AppColors.onPrimary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.md,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
