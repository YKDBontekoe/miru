import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'design_system/design_system.dart';
import 'services/passkey_service.dart';
import 'services/supabase_service.dart';

/// The login screen for Miru.
///
/// Supports two flows:
///   1. **Magic link** — user enters their email and receives a sign-in link.
///   2. **Passkey** — user authenticates with a registered passkey (biometrics /
///      security key).
///
/// On successful authentication the [StreamBuilder] in [main.dart] detects the
/// auth-state change and navigates to [ChatPage] automatically.
class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _magicLinkSent = false;
  bool _isLoadingMagicLink = false;
  bool _isLoadingPasskey = false;
  String? _errorMessage;

  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  // Deep-link auth listener (for magic link callback).
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: AppDurations.medium,
    )..forward();
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );

    // Listen for auth state changes triggered by the magic-link deep link.
    _authSubscription = SupabaseService.authStateChanges.listen((state) {
      if (state.event == AuthChangeEvent.signedIn && mounted) {
        // Navigation is handled by the StreamBuilder in main.dart.
        // Clear any error state here.
        setState(() => _errorMessage = null);
      }
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _fadeController.dispose();
    _authSubscription?.cancel();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Magic link
  // ---------------------------------------------------------------------------

  Future<void> _sendMagicLink() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isLoadingMagicLink = true;
      _errorMessage = null;
    });

    try {
      await SupabaseService.signInWithMagicLink(
        email: _emailController.text.trim(),
        // Deep-link URI — configure in Supabase Dashboard and app_links.
        redirectTo: 'io.miru.app://login-callback',
      );
      if (mounted) {
        setState(() => _magicLinkSent = true);
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.message);
      }
    } catch (e) {
      if (mounted) {
        setState(
            () => _errorMessage = 'Something went wrong. Please try again.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingMagicLink = false);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Passkey login
  // ---------------------------------------------------------------------------

  Future<void> _signInWithPasskey() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isLoadingPasskey = true;
      _errorMessage = null;
    });

    try {
      final email = _emailController.text.trim();

      // Step 1: Get authentication options from the backend.
      final optionsData = await PasskeyService.getAuthenticationOptions(
        email: email,
      );
      final challengeId = optionsData['challenge_id'] as String;
      final options = optionsData['options'] as Map<String, dynamic>;

      // Step 2: Invoke the platform passkey API.
      final credentialJson =
          await PasskeyService.platformGetCredential(options);

      // Step 3: Verify with the backend — this also sets the Supabase session.
      await PasskeyService.verifyAuthentication(
        challengeId: challengeId,
        credentialJson: credentialJson,
      );

      // Auth state change triggers navigation via main.dart StreamBuilder.
    } on PasskeyException catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.detail);
      }
    } on UnsupportedError catch (e) {
      if (mounted) {
        setState(() => _errorMessage =
            e.message ?? 'Passkeys are not supported on this device.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage =
            'Passkey sign-in failed. Please try magic link instead.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingPasskey = false);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.xxl,
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: _magicLinkSent
                    ? _buildMagicLinkSentState(colors)
                    : _buildLoginForm(colors),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm(AppThemeColors colors) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Logo / branding
          const MiruOrbVisual(size: 80),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Welcome to Miru',
            style: AppTypography.headingLarge.copyWith(
              color: colors.onSurface,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Sign in with a magic link or your passkey.',
            style: AppTypography.bodyMedium.copyWith(
              color: colors.onSurfaceMuted,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Email field
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autocorrect: false,
            autofillHints: const [AutofillHints.email],
            style: AppTypography.bodyMedium.copyWith(color: colors.onSurface),
            decoration: InputDecoration(
              labelText: 'Email address',
              hintText: 'you@example.com',
              prefixIcon: Icon(
                Icons.email_outlined,
                color: colors.onSurfaceMuted,
                size: AppSpacing.iconMd,
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Please enter your email';
              }
              if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value.trim())) {
                return 'Please enter a valid email';
              }
              return null;
            },
            onFieldSubmitted: (_) => _sendMagicLink(),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Error message
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.sm),
                border:
                    Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: AppColors.error, size: 16),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],

          // Magic link button (primary action)
          FilledButton(
            onPressed: _isLoadingMagicLink || _isLoadingPasskey
                ? null
                : _sendMagicLink,
            child: _isLoadingMagicLink
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Send magic link'),
          ),
          const SizedBox(height: AppSpacing.md),

          // Divider
          Row(
            children: [
              Expanded(child: Divider(color: colors.border)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Text(
                  'or',
                  style: AppTypography.bodySmall.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ),
              Expanded(child: Divider(color: colors.border)),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Passkey button (secondary action)
          OutlinedButton.icon(
            onPressed: _isLoadingMagicLink || _isLoadingPasskey
                ? null
                : _signInWithPasskey,
            icon: _isLoadingPasskey
                ? const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.fingerprint_rounded),
            label: const Text('Sign in with passkey'),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Privacy note
          Text(
            'By signing in you agree to keep your account secure.\n'
            'Magic links expire after 1 hour.',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMagicLinkSentState(AppThemeColors colors) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Icon(
          Icons.mark_email_read_outlined,
          size: 64,
          color: AppColors.primary,
        ),
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Check your email',
          style: AppTypography.headingLarge.copyWith(
            color: colors.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'We sent a magic link to\n${_emailController.text.trim()}',
          style: AppTypography.bodyMedium.copyWith(
            color: colors.onSurfaceMuted,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Tap the link in the email to sign in. '
          'It will expire in 1 hour.',
          style: AppTypography.bodySmall.copyWith(
            color: colors.onSurfaceMuted,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xxl),
        OutlinedButton(
          onPressed: () => setState(() {
            _magicLinkSent = false;
            _errorMessage = null;
          }),
          child: const Text('Use a different email'),
        ),
      ],
    );
  }
}
