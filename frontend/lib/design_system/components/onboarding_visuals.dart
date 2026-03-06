import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../tokens/colors.dart';

// ---------------------------------------------------------------------------
// 1. Miru Orb Visual (Hero / Logo)
// ---------------------------------------------------------------------------

class MiruOrbVisual extends StatefulWidget {
  final double size;
  final bool animate;

  const MiruOrbVisual({
    super.key,
    this.size = 280,
    this.animate = true,
  });

  @override
  State<MiruOrbVisual> createState() => _MiruOrbVisualState();
}

class _MiruOrbVisualState extends State<MiruOrbVisual>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
    if (widget.animate) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _OrbPainter(_controller.value, widget.size),
        );
      },
    );
  }
}

class _OrbPainter extends CustomPainter {
  final double progress;
  final double size;
  _OrbPainter(this.progress, this.size);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 3.2;

    // 1. Outer Bloom
    final bloomPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.primary.withOpacity(0.4),
          AppColors.primary.withOpacity(0.0),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: radius * 2.5))
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, radius * 0.4);
    canvas.drawCircle(center, radius * 2, bloomPaint);

    // 2. Core Glow
    final corePaint = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.white,
          AppColors.primary,
          AppColors.primaryDark,
        ],
        stops: const [0.0, 0.4, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, corePaint);

    // 3. Rotating "Neural" Rings
    final ringPaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.006;

    for (var i = 0; i < 3; i++) {
      final rotation = (progress * 2 * math.pi) + (i * math.pi / 1.5);
      final ringRadius = radius * (0.9 + i * 0.15);
      
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(rotation);
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset.zero,
          width: ringRadius * 2,
          height: ringRadius * 0.4,
        ),
        ringPaint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _OrbPainter oldDelegate) => true;
}

// ---------------------------------------------------------------------------
// 2. Context Memory Visual
// ---------------------------------------------------------------------------

class ContextMemoryVisual extends StatefulWidget {
  final double size;
  const ContextMemoryVisual({super.key, this.size = 280});

  @override
  State<ContextMemoryVisual> createState() => _ContextMemoryVisualState();
}

class _ContextMemoryVisualState extends State<ContextMemoryVisual>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size * 0.85),
          painter: _MemoryPainter(_controller.value),
        );
      },
    );
  }
}

class _MemoryPainter extends CustomPainter {
  final double progress;
  _MemoryPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final scale = size.width / 280;
    
    for (var i = 0; i < 4; i++) {
      final yOffset = (i - 1.5) * 45.0 * scale + (progress * 10 * scale * (i.isEven ? 1 : -1));
      final opacity = 1.0 - (i * 0.2);
      final width = (160.0 - (i * 15)) * scale;
      
      final rect = Rect.fromCenter(
        center: center.translate(0, yOffset),
        width: width,
        height: 30 * scale,
      );

      final rrect = RRect.fromRectAndRadius(rect, Radius.circular(8 * scale));
      
      // Shadow/Glow
      canvas.drawRRect(
        rrect,
        Paint()
          ..color = AppColors.success.withOpacity(0.15 * opacity)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 10 * scale),
      );

      // Plate
      canvas.drawRRect(
        rrect,
        Paint()
          ..shader = LinearGradient(
            colors: [
              AppColors.success.withOpacity(0.6 * opacity),
              AppColors.success.withOpacity(0.1 * opacity),
            ],
          ).createShader(rect),
      );

      // Border
      canvas.drawRRect(
        rrect,
        Paint()
          ..color = AppColors.success.withOpacity(0.4 * opacity)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1 * scale,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _MemoryPainter oldDelegate) => true;
}

// ---------------------------------------------------------------------------
// 3. Privacy Shield Visual
// ---------------------------------------------------------------------------

class PrivacyShieldVisual extends StatefulWidget {
  final double size;
  const PrivacyShieldVisual({super.key, this.size = 280});

  @override
  State<PrivacyShieldVisual> createState() => _PrivacyShieldVisualState();
}

class _PrivacyShieldVisualState extends State<PrivacyShieldVisual>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _ShieldPainter(_controller.value),
        );
      },
    );
  }
}

class _ShieldPainter extends CustomPainter {
  final double progress;
  _ShieldPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final scale = size.width / 280;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2 * scale
      ..color = AppColors.info;

    // 1. Pulsing Rings
    final pulseRadius = (60 + (progress * 60)) * scale;
    final pulseOpacity = 1.0 - progress;
    canvas.drawCircle(
      center,
      pulseRadius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5 * scale
        ..color = AppColors.info.withOpacity(pulseOpacity * 0.5),
    );

    // 2. Main Shield Shape
    final path = Path();
    final w = 80.0 * scale;
    final h = 100.0 * scale;
    
    path.moveTo(center.dx, center.dy - h/2);
    path.quadraticBezierTo(center.dx + w/2, center.dy - h/2, center.dx + w/2, center.dy);
    path.quadraticBezierTo(center.dx + w/2, center.dy + h/2, center.dx, center.dy + h*0.7);
    path.quadraticBezierTo(center.dx - w/2, center.dy + h/2, center.dx - w/2, center.dy);
    path.quadraticBezierTo(center.dx - w/2, center.dy - h/2, center.dx, center.dy - h/2);

    canvas.drawPath(
      path,
      Paint()
        ..color = AppColors.info.withOpacity(0.15)
        ..style = PaintingStyle.fill,
    );
    
    canvas.drawPath(path, paint..strokeWidth = 2.5 * scale);

    // 3. Central "Core"
    canvas.drawCircle(
      center,
      12 * scale,
      Paint()..color = AppColors.info,
    );
    
    canvas.drawCircle(
      center,
      (20 + (math.sin(progress * math.pi) * 5)) * scale,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1 * scale
        ..color = AppColors.info.withOpacity(0.4),
    );
  }

  @override
  bool shouldRepaint(covariant _ShieldPainter oldDelegate) => true;
}
