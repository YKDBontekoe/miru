import 'dart:ui';
import 'package:flutter/material.dart';
import 'design_system/design_system.dart';
import 'rooms_page.dart';
import 'settings_page.dart';

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;
  final ValueNotifier<int> _personaRefreshNotifier = ValueNotifier<int>(0);

  void _onItemTapped(int index) {
    if (index == 1) {
      _showCreatePersona();
      return;
    }
    setState(() {
      _currentIndex = index == 2 ? 1 : 0;
    });
  }

  Future<void> _showCreatePersona() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
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
          RoomsPage(personaRefreshListenable: _personaRefreshNotifier),
          const SettingsPage(),
        ],
      ),
      bottomNavigationBar: _buildLiquidGlassNavBar(colors),
    );
  }

  Widget _buildLiquidGlassNavBar(AppThemeColors colors) {
    return Container(
      margin: const EdgeInsets.fromLTRB(
          AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xl),
      height: 72, // increased height slightly for the new button
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
                _buildCreateButton(colors),
                _buildNavItem(
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings_rounded,
                  label: 'Settings',
                  isActive: _currentIndex == 1,
                  onTap: () => _onItemTapped(2),
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
            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: isActive
              ? colors.primary.withValues(alpha: 0.15)
              : Colors.transparent,
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
            const SizedBox(height: 2),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: AppTypography.labelSmall.copyWith(
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
    return GestureDetector(
      onTap: _showCreatePersona,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.primaryLight, colors.primary],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: colors.primary.withValues(alpha: 0.5),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
            BoxShadow(
              color: colors.primary.withValues(alpha: 0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Icon(
          Icons.add_rounded,
          color: AppColors.onPrimary,
          size: 32,
        ),
      ),
    );
  }
}
