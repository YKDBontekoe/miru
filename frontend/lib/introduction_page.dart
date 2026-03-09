import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'design_system/design_system.dart';
import 'chat_page.dart';
import 'backend_service.dart';

class IntroductionPage extends StatefulWidget {
  const IntroductionPage({super.key});

  @override
  State<IntroductionPage> createState() => _IntroductionPageState();
}

class _IntroductionPageState extends State<IntroductionPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'Meet Miru',
      description:
          'Your personal AI assistant that remembers you and grows with you.',
      visual: const MiruOrbVisual(),
      color: AppColors.primary,
    ),
    OnboardingData(
      title: 'Context Aware',
      description:
          'Miru understands your past conversations to provide better help.',
      visual: const ContextMemoryVisual(),
      color: AppColors.success,
    ),
    OnboardingData(
      title: 'Privacy First',
      description:
          'Your data is yours. Miru is designed with security and privacy in mind.',
      visual: const PrivacyShieldVisual(),
      color: AppColors.info,
    ),
  ];

  void _onNext() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: AppDurations.medium,
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() {
    BackendService.setOnboardingComplete(true);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ChatPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFF1E293B), // Slate 800
                Color(0xFF0F172A), // Slate 900
                Color(0xFF020617), // Slate 950 (Deep)
              ],
              stops: [0.0, 0.4, 1.0],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _pages.length,
                    itemBuilder: (context, index) {
                      return OnboardingContent(data: _pages[index]);
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (index) => _buildPageIndicator(index),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _onNext,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.onPrimary,
                            shadowColor:
                                AppColors.primary.withValues(alpha: 0.5),
                            elevation: 8,
                          ),
                          child: Text(
                            _currentPage == _pages.length - 1
                                ? 'Get Started'
                                : 'Next',
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      if (_currentPage < _pages.length - 1)
                        TextButton(
                          onPressed: _finishOnboarding,
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.onSurfaceMutedDark,
                          ),
                          child: const Text('Skip'),
                        )
                      else
                        const SizedBox(height: AppSpacing.buttonHeightSm),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPageIndicator(int index) {
    final isActive = _currentPage == index;
    return AnimatedContainer(
      duration: AppDurations.fast,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
      height: 8,
      width: isActive ? 24 : 8,
      decoration: BoxDecoration(
        color: isActive
            ? AppColors.primary
            : AppColors.borderDark.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final Widget visual;
  final Color color;

  OnboardingData({
    required this.title,
    required this.description,
    required this.visual,
    required this.color,
  });
}

class OnboardingContent extends StatelessWidget {
  final OnboardingData data;

  const OnboardingContent({
    super.key,
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Center(
              child: ConstrainedBox(
                constraints:
                    const BoxConstraints(maxWidth: 300, maxHeight: 300),
                child: data.visual,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            data.title,
            style: AppTypography.displaySmall.copyWith(
              color: AppColors.onSurfaceDark,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Text(
              data.description,
              style: AppTypography.bodyLarge.copyWith(
                color: AppColors.onSurfaceMutedDark,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
