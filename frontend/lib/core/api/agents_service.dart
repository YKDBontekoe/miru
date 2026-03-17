import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/agent.dart';
import 'api_service.dart';

final agentsProvider = FutureProvider.autoDispose<List<Agent>>((ref) async {
  return ApiService.instance.getAgents();
});
