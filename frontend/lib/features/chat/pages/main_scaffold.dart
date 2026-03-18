import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/features/rooms/pages/rooms_page.dart';
import 'package:miru/features/rooms/widgets/create_persona_sheet.dart';
import 'package:miru/features/settings/pages/settings_page.dart';
import 'package:miru/features/productivity/pages/action_page.dart';

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;
  final ValueNotifier<int> _personaRefreshNotifier = ValueNotifier<int>(0);

  void _onItemTapped(int index) {
    if (index == 2) {
      _showCreatePersona();
      return;
    }
    setState(() {
      _currentIndex = index;
    });
  }

  Future<void> _showCreatePersona() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.transparent,
      builder: (context) => const CreatePersonaSheet(),
    );

    if (created == true) {
      _personaRefreshNotifier.value++;
    }
  }

  @override
  void dispose() {
    _personaRefreshNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          RoomsPage(personaRefreshListenable: _personaRefreshNotifier), // 0
          const ActionPage(), // 1
          const SizedBox(), // Placeholder for index 2 (Add button)     // 2
          const SettingsPage(), // 3
        ],
      ),
      bottomNavigationBar: _buildLiquidGlassNavBar(colors),
    );
  }

  Widget _buildLiquidGlassNavBar(AppThemeColors colors) {
    return Container(
      margin: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        0,
        AppSpacing.md,
        AppSpacing.md,
      ),
      height: AppSpacing.bottomNavBarHeight,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            decoration: BoxDecoration(
              color: colors.surfaceHigh.withValues(alpha: 0.75),
              borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
              border: Border.all(
                color: colors.border.withValues(alpha: 0.4),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(
                  icon: Icons.chat_bubble_outline_rounded,
                  activeIcon: Icons.chat_bubble_rounded,
                  label: 'Rooms',
                  isActive: _currentIndex == 0,
                  onTap: () => _onItemTapped(0),
                  colors: colors,
                ),
                _buildNavItem(
                  icon: Icons.bolt_outlined,
                  activeIcon: Icons.bolt_rounded,
                  label: 'Action',
                  isActive: _currentIndex == 1,
                  onTap: () => _onItemTapped(1),
                  colors: colors,
                ),
                _buildCreateButton(colors),
                _buildNavItem(
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings_rounded,
                  label: 'Settings',
                  isActive: _currentIndex == 3,
                  onTap: () => _onItemTapped(3),
                  colors: colors,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
    required AppThemeColors colors,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? colors.primary.withValues(alpha: 0.15)
              : AppColors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              transitionBuilder: (child, animation) =>
                  ScaleTransition(scale: animation, child: child),
              child: Icon(
                isActive ? activeIcon : icon,
                key: ValueKey<bool>(isActive),
                color: isActive ? colors.primary : colors.onSurfaceMuted,
                size: 24,
              ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: isActive ? colors.primary : colors.onSurfaceMuted,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreateButton(AppThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colors.primaryLight, colors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
        boxShadow: AppShadows.primaryGlow,
      ),
      child: Material(
        color: AppColors.transparent,
        shape: const CircleBorder(),
        clipBehavior: Clip.hardEdge,
        child: InkWell(
          onTap: _showCreatePersona,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: const Icon(
              Icons.add_rounded,
              color: AppColors.onPrimary,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }
}
