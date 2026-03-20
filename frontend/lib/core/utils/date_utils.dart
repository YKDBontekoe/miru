/// Utility class for date formatting.
class AppDateUtils {
  /// Formats an ISO 8601 date string into a readable format (e.g., 'Jan 1, 2023').
  static String formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate).toLocal();
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return isoDate;
    }
  }
}
