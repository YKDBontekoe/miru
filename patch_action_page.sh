sed -i 's/isSelected ? \[AppShadows.sm\] : \[\]/isSelected ? \[AppShadows.sm.first\] : \[\]/' frontend/lib/features/productivity/pages/action_page.dart
sed -i 's/colors.onPrimary/colors.surfaceHigh/' frontend/lib/features/productivity/pages/action_page.dart
sed -i "s/'\\\${DateFormat('h:mm a').format(event.startTime.toLocal())} - \\\${DateFormat('h:mm a').format(event.endTime.toLocal())}'/\"\${DateFormat('h:mm a').format(event.startTime.toLocal())} - \${DateFormat('h:mm a').format(event.endTime.toLocal())}\"/" frontend/lib/features/productivity/pages/action_page.dart
sed -i 's/BorderStyle.dash/BorderStyle.solid/' frontend/lib/features/productivity/pages/action_page.dart
