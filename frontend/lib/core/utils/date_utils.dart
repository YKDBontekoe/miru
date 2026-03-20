/// Utility class for date formatting.
class AppDateUtils {
  static const List<String> _months = [
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

  /// Formats an ISO 8601 date string into a readable format (e.g., 'Jan 1, 2023').
  static String formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate).toLocal();
      return '${_months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return isoDate;
    }
  }
}
