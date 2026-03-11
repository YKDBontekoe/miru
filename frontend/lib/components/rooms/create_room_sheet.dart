import 'package:flutter/material.dart';
import '../../api_service.dart';
import '../../models/agent.dart';
import '../../design_system/design_system.dart';

class CreateRoomSheet extends StatefulWidget {
  final List<Agent> availableAgents;
  final VoidCallback onRoomCreated;

  const CreateRoomSheet({
    super.key,
    required this.availableAgents,
    required this.onRoomCreated,
  });

  @override
  State<CreateRoomSheet> createState() => _CreateRoomSheetState();
}

class _CreateRoomSheetState extends State<CreateRoomSheet> {
  final _nameController = TextEditingController();
  final Set<String> _selectedAgentIds = {};
  bool _isCreating = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _toggleAgent(String id) {
    setState(() {
      if (_selectedAgentIds.contains(id)) {
        _selectedAgentIds.remove(id);
      } else {
        _selectedAgentIds.add(id);
      }
    });
  }

  Future<void> _createRoom() async {
    final name = _nameController.text.trim();

    setState(() => _isCreating = true);
    try {
      final room = await ApiService.createRoom(name);
      final roomId = room['id'] as String;

      if (_selectedAgentIds.isNotEmpty) {
        await Future.wait(
          _selectedAgentIds.map(
            (agentId) => ApiService.addAgentToRoom(roomId, agentId),
          ),
        );
      }

      if (mounted) {
        Navigator.pop(context);
        widget.onRoomCreated();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating room: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
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

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('New Room', style: textTheme.titleLarge),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: colors.onSurfaceMuted),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // Name
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Room Name (Optional)',
              hintText: 'e.g. Project Brainstorm',
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Personas selection
          Text(
            'ADD PERSONAS',
            style: AppTypography.labelSmall.copyWith(
              color: colors.onSurfaceMuted,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          if (widget.availableAgents.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Text(
                'No personas available. Create one first!',
                style: textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceMuted,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: widget.availableAgents.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final agent = widget.availableAgents[index];
                  final isSelected = _selectedAgentIds.contains(agent.id);

                  return InkWell(
                    onTap: () => _toggleAgent(agent.id),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? colors.primaryLight.withValues(alpha: 0.1)
                            : colors.surfaceHigh,
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(
                          color:
                              isSelected ? colors.primaryLight : colors.border,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: colors.primaryLight.withValues(
                              alpha: 0.15,
                            ),
                            child: Text(
                              agent.name.substring(0, 1).toUpperCase(),
                              style: textTheme.titleSmall?.copyWith(
                                color: colors.primaryLight,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(agent.name, style: textTheme.titleSmall),
                                Text(
                                  agent.role,
                                  style: AppTypography.caption.copyWith(
                                    color: colors.onSurfaceMuted,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(
                              Icons.check_circle_rounded,
                              color: colors.primaryLight,
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: AppSpacing.xl),

          // Create button
          FilledButton(
            onPressed: _isCreating ? null : _createRoom,
            child: _isCreating
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.onPrimary,
                    ),
                  )
                : const Text('Create Room'),
          ),
        ],
      ),
    );
  }
}
