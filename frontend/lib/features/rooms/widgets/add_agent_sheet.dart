import 'package:flutter/material.dart';
import 'package:miru/core/models/agent.dart';
import 'package:miru/core/design_system/design_system.dart';

// ---------------------------------------------------------------------------
// Add agent bottom sheet
// ---------------------------------------------------------------------------

class AddAgentSheet extends StatefulWidget {
  final List<Agent> allAgents;
  final List<Agent> roomAgents;
  final Future<void> Function(String agentId) onAdd;

  const AddAgentSheet({
    super.key,
    required this.allAgents,
    required this.roomAgents,
    required this.onAdd,
  });

  @override
  State<AddAgentSheet> createState() => AddAgentSheetState();
}

class AddAgentSheetState extends State<AddAgentSheet> {
  String? _addingId;

  Future<void> _addAgent(String agentId) async {
    setState(() => _addingId = agentId);
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await widget.onAdd(agentId);
      if (mounted) navigator.pop();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _addingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.65,
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl + bottomPadding,
      ),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusLg),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Add Persona', style: AppTypography.headingSmall),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'SELECT PERSONAS',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: widget.allAgents.length,
              itemBuilder: (context, index) {
                final agent = widget.allAgents[index];
                final isInRoom = widget.roomAgents.any((a) => a.id == agent.id);
                final isAdding = _addingId == agent.id;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: colors.primary.withValues(alpha: 0.1),
                    backgroundImage: agent.avatarImage,
                    child: agent.avatarUrl == null
                        ? null
                        : Text(
                            agent.name[0].toUpperCase(),
                            style: AppTypography.labelMedium.copyWith(
                              color: colors.primary,
                            ),
                          ),
                  ),
                  title: Text(agent.name, style: AppTypography.bodyMedium),
                  subtitle: Text(
                    agent.personality,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption.copyWith(
                      color: colors.onSurfaceMuted,
                    ),
                  ),
                  trailing: isInRoom
                      ? Icon(Icons.check_rounded, color: AppColors.success)
                      : isAdding
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(Icons.add_rounded, color: colors.onSurfaceMuted),
                  onTap: isInRoom || isAdding
                      ? null
                      : () {
                          _addAgent(agent.id);
                        },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
