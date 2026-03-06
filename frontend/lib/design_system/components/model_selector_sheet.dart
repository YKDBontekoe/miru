import 'package:flutter/material.dart';

import '../../api_service.dart';
import '../extensions/build_context_extensions.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';

/// A bottom sheet that lets the user pick an OpenRouter model.
///
/// Shows a searchable list loaded from the backend [ApiService.fetchModels].
/// Calls [onSelected] with the chosen model ID when the user taps an entry.
///
/// ```dart
/// showModalBottomSheet(
///   context: context,
///   builder: (_) => ModelSelectorSheet(
///     currentModel: _selectedModel,
///     onSelected: (id) => setState(() => _selectedModel = id),
///   ),
/// );
/// ```
class ModelSelectorSheet extends StatefulWidget {
  final String? currentModel;
  final ValueChanged<String?> onSelected;

  const ModelSelectorSheet({
    super.key,
    this.currentModel,
    required this.onSelected,
  });

  @override
  State<ModelSelectorSheet> createState() => _ModelSelectorSheetState();
}

class _ModelSelectorSheetState extends State<ModelSelectorSheet> {
  final TextEditingController _searchController = TextEditingController();
  List<OpenRouterModel> _allModels = [];
  List<OpenRouterModel> _filtered = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadModels();
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController
      ..removeListener(_onSearch)
      ..dispose();
    super.dispose();
  }

  Future<void> _loadModels() async {
    try {
      final models = await ApiService.fetchModels();
      if (mounted) {
        setState(() {
          _allModels = models;
          _filtered = models;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _onSearch() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filtered = query.isEmpty
          ? _allModels
          : _allModels
              .where(
                (m) =>
                    m.id.toLowerCase().contains(query) ||
                    m.name.toLowerCase().contains(query),
              )
              .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppSpacing.radiusLg),
            ),
          ),
          child: Column(
            children: [
              // Drag handle
              _DragHandle(colors: colors),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.xs,
                  AppSpacing.lg,
                  AppSpacing.md,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Select Model',
                        style: AppTypography.headingSmall.copyWith(
                          color: colors.onSurface,
                        ),
                      ),
                    ),
                    // "Use default" option
                    if (widget.currentModel != null)
                      TextButton(
                        onPressed: () {
                          widget.onSelected(null);
                          Navigator.of(context).pop();
                        },
                        child: Text(
                          'Use default',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Search field
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: TextField(
                  controller: _searchController,
                  autofocus: false,
                  style: AppTypography.bodySmall.copyWith(
                    color: colors.onSurface,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Search models...',
                    hintStyle: AppTypography.bodySmall.copyWith(
                      color: colors.onSurfaceMuted,
                    ),
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      size: AppSpacing.iconMd,
                      color: colors.onSurfaceMuted,
                    ),
                    filled: true,
                    fillColor: colors.surfaceHigh,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.radiusFull,
                      ),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.radiusFull,
                      ),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.radiusFull,
                      ),
                      borderSide: BorderSide(
                        color: AppColors.primary.withAlpha(100),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.sm),

              // Content
              Expanded(child: _buildContent(scrollController, colors)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContent(ScrollController scrollController, dynamic colors) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: AppSpacing.paddingAllLg,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                color: (colors as dynamic).error as Color,
                size: AppSpacing.iconXl,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Could not load models',
                style: AppTypography.labelMedium.copyWith(
                  color: (colors).onSurface as Color,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                _error!,
                style: AppTypography.caption.copyWith(
                  color: (colors).onSurfaceMuted as Color,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _loading = true;
                    _error = null;
                  });
                  _loadModels();
                },
                icon: const Icon(
                  Icons.refresh_rounded,
                  size: AppSpacing.iconMd,
                ),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_filtered.isEmpty) {
      return Center(
        child: Text(
          'No models found',
          style: AppTypography.bodySmall.copyWith(
            color: (colors as dynamic).onSurfaceMuted as Color,
          ),
        ),
      );
    }

    return ListView.builder(
      controller: scrollController,
      itemCount: _filtered.length,
      itemBuilder: (context, index) {
        final model = _filtered[index];
        final isSelected = model.id == widget.currentModel;
        return _ModelTile(
          model: model,
          isSelected: isSelected,
          onTap: () {
            widget.onSelected(model.id);
            Navigator.of(context).pop();
          },
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

class _DragHandle extends StatelessWidget {
  final dynamic colors;

  const _DragHandle({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        width: 36,
        height: 4,
        decoration: BoxDecoration(
          color: (colors as dynamic).border as Color,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
      ),
    );
  }
}

class _ModelTile extends StatelessWidget {
  final OpenRouterModel model;
  final bool isSelected;
  final VoidCallback onTap;

  const _ModelTile({
    required this.model,
    required this.isSelected,
    required this.onTap,
  });

  /// Formats a per-token price (in USD string) to a readable label.
  String _formatPrice(dynamic price) {
    if (price == null) return '';
    final val = double.tryParse(price.toString());
    if (val == null || val == 0) return 'free';
    if (val < 0.000001) return '<\$0.001/M';
    final perMillion = val * 1000000;
    return '\$${perMillion.toStringAsFixed(perMillion < 1 ? 3 : 2)}/M';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final promptPrice = _formatPrice(model.pricing['prompt']);

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        color: isSelected ? AppColors.primarySurface : null,
        child: Row(
          children: [
            // Provider icon placeholder
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withAlpha(40)
                    : colors.surfaceHigh,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(
                Icons.smart_toy_outlined,
                size: AppSpacing.iconMd,
                color: isSelected ? AppColors.primary : colors.onSurfaceMuted,
              ),
            ),

            const SizedBox(width: AppSpacing.md),

            // Name + description
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    model.name,
                    style: AppTypography.labelMedium.copyWith(
                      color: isSelected ? AppColors.primary : colors.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (model.description.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      model.description,
                      style: AppTypography.caption.copyWith(
                        color: colors.onSurfaceMuted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(width: AppSpacing.sm),

            // Price chip
            if (promptPrice.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xxs,
                ),
                decoration: BoxDecoration(
                  color: colors.surfaceHighest,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                ),
                child: Text(
                  promptPrice,
                  style: AppTypography.captionSmall.copyWith(
                    color: colors.onSurfaceMuted,
                  ),
                ),
              ),

            if (isSelected) ...[
              const SizedBox(width: AppSpacing.sm),
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.primary,
                size: AppSpacing.iconMd,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
