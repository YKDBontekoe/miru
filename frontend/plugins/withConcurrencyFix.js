const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to fix Swift 6 concurrency issues in Xcode 16+
 */
const withConcurrencyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const fixCode = `
    # Fix for Swift 6 concurrency issues in Xcode 16+
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
        config.build_settings['SWIFT_VERSION'] = '5.5'
      end
    end
`;

      if (!podfileContent.includes('SWIFT_STRICT_CONCURRENCY')) {
        // Find the post_install block and append our fix
        const searchString =
          'react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)';
        if (podfileContent.includes(searchString)) {
          podfileContent = podfileContent.replace(searchString, searchString + fixCode);
        } else {
          // Fallback: try to find any react_native_post_install call
          podfileContent = podfileContent.replace(
            /react_native_post_install\(.*?\)/,
            '$&' + fixCode
          );
        }
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withConcurrencyFix;
