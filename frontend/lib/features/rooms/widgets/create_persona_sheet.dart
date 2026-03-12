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

  @override
  void dispose() {
    _nameController.dispose();
    _personalityController.dispose();
    _keywordController.dispose();
    super.dispose();
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

    setState(() => _isSaving = true);
    try {
      await ApiService.createAgent(name, personality);
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
