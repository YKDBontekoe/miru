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

      if (!podfileContent.includes('SWIFT_STRICT_CONCURRENCY')) {
        // Append a separate post_install block — CocoaPods runs all of them
        podfileContent += `
# Fix for Swift 6 concurrency issues in Xcode 16+
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
    end
  end
end
`;
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withConcurrencyFix;
