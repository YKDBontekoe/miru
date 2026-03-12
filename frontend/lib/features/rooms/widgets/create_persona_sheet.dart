import 'package:flutter/material.dart';
import 'package:miru/core/api/api_service.dart';
import 'package:miru/core/design_system/design_system.dart';

class CreatePersonaSheet extends StatefulWidget {
  const CreatePersonaSheet({super.key});

  @override
  State<CreatePersonaSheet> createState() => _CreatePersonaSheetState();
}

class _CreatePersonaSheetState extends State<CreatePersonaSheet> {
  final _nameController = TextEditingController();
  final _personalityController = TextEditingController();
  final _keywordController = TextEditingController();
  bool _isGenerating = false;
  bool _isSaving = false;

  static const int _maxPersonalityChars = 300;

  bool _enableSteam = false;
  final _steamUserController = TextEditingController();
  bool _isResolvingSteam = false;
  String? _resolvedSteamId;
  String? _resolvedSteamName;

  @override
  void dispose() {
    _nameController.dispose();
    _personalityController.dispose();
    _keywordController.dispose();
    _steamUserController.dispose();
    super.dispose();
  }

  Future<void> _resolveSteamUser() async {
    final query = _steamUserController.text.trim();
    if (query.isEmpty) return;

    setState(() => _isResolvingSteam = true);
    try {
      final res = await ApiService.resolveSteamUser(query);
      setState(() {
        _resolvedSteamId = res['steam_id'] as String?;
        _resolvedSteamName = res['persona_name'] as String?;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not find Steam user'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isResolvingSteam = false);
    }
  }

  Future<void> _generateAI() async {
    final keywords = _keywordController.text.trim();
    if (keywords.isEmpty) return;

    setState(() => _isGenerating = true);
    try {
      final res = await ApiService.generateAgent(keywords);
      setState(() {
        _nameController.text = res.name;
        _personalityController.text = res.personality;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Generation failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    final personality = _personalityController.text.trim();
    if (name.isEmpty || personality.isEmpty) return;

    if (_enableSteam && _resolvedSteamId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Please connect your Steam account or disable the integration.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final integrations = <String>[];
      final Map<String, dynamic> configs = {};

      if (_enableSteam && _resolvedSteamId != null) {
        integrations.add('steam');
        configs['steam'] = {'steam_id': _resolvedSteamId};
      }

      await ApiService.createAgent(
        name,
        personality,
        integrations: integrations,
        integrationConfigs: configs,
      );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Save failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final textTheme = context.textTheme;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.xl + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.lg),
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
            ),
          ),

          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('New Persona', style: textTheme.titleLarge),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: colors.onSurfaceMuted),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // --- Name field ---
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Name',
              hintText: 'e.g. Luna, Captain Rex',
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // --- Personality field with char counter ---
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: _personalityController,
            builder: (context, value, _) {
              final count = value.text.length;
              final overLimit = count > _maxPersonalityChars;
              return TextField(
                controller: _personalityController,
                maxLines: 4,
                maxLength: _maxPersonalityChars,
                decoration: InputDecoration(
                  labelText: 'Personality / Instructions',
                  hintText: 'Describe how this persona speaks and behaves...',
                  counterStyle: AppTypography.labelSmall.copyWith(
                    color: overLimit ? AppColors.error : colors.onSurfaceMuted,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // --- Steam Integration section ---
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            margin: const EdgeInsets.only(bottom: AppSpacing.lg),
            decoration: BoxDecoration(
              color: colors.surfaceHigh,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: colors.border.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.videogame_asset,
                          size: 14,
                          color: colors.onSurface,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          'STEAM INTEGRATION',
                          style: AppTypography.labelSmall.copyWith(
                            color: colors.onSurface,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    Switch(
                      value: _enableSteam,
                      onChanged: (v) => setState(() => _enableSteam = v),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
                if (_enableSteam) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _steamUserController,
                          decoration: InputDecoration(
                            hintText: 'Steam Username or Steam64 ID',
                            isDense: true,
                            fillColor: colors.surfaceHighest,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(
                        height: 44,
                        child: FilledButton(
                          onPressed:
                              _isResolvingSteam || _resolvedSteamId != null
                                  ? null
                                  : _resolveSteamUser,
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md),
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(AppSpacing.radiusMd),
                            ),
                          ),
                          child: _isResolvingSteam
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.onPrimary,
                                  ),
                                )
                              : Text(_resolvedSteamId != null
                                  ? 'Connected'
                                  : 'Connect'),
                        ),
                      ),
                    ],
                  ),
                  if (_resolvedSteamName != null)
                    Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.sm),
                      child: Text(
                        'Connected to: $_resolvedSteamName',
                        style: AppTypography.bodySmall
                            .copyWith(color: AppColors.success),
                      ),
                    ),
                ],
              ],
            ),
          ),

          // --- AI generation section ---
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.surfaceHigh,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border: Border.all(color: colors.border.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      size: 14,
                      color: colors.primaryLight,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'GENERATE WITH AI',
                      style: AppTypography.labelSmall.copyWith(
                        color: colors.primaryLight,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _keywordController,
                        decoration: InputDecoration(
                          hintText: 'e.g. funny pirate, stern scientist',
                          isDense: true,
                          fillColor: colors.surfaceHighest,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    SizedBox(
                      width: 44,
                      height: 44,
                      child: FilledButton(
                        onPressed: _isGenerating ? null : _generateAI,
                        style: FilledButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.radiusMd,
                            ),
                          ),
                        ),
                        child: _isGenerating
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.onPrimary,
                                ),
                              )
                            : const Icon(Icons.auto_awesome_rounded, size: 20),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // --- Save button ---
          FilledButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.onPrimary,
                    ),
                  )
                : const Text('Save Persona'),
          ),
        ],
      ),
    );
  }
}
