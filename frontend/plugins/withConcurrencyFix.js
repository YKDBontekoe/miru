const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to fix Swift 6 concurrency issues in Xcode 16+
 *
 * Expo SDK 55 podspecs declare swift-language-version 6, which causes hard
 * build errors on Xcode 16 runners. We override SWIFT_VERSION back to 5 and
 * set SWIFT_STRICT_CONCURRENCY=minimal for every pod target in post_install.
 *
 * Strategy: inject inside the existing post_install block (CocoaPods on some
 * versions rejects multiple post_install blocks entirely).
 */
const withConcurrencyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      // platformProjectRoot already points at the ios/ dir
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      if (podfileContent.includes('SWIFT_STRICT_CONCURRENCY')) {
        // Already patched — nothing to do
        return config;
      }

      const fixSnippet = `
  # ---- Swift 6 concurrency fix (withConcurrencyFix plugin) ----
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |cfg|
      # Force Swift 5 language mode so SDK 55 podspecs don't compile as Swift 6
      cfg.build_settings['SWIFT_VERSION'] = '5'
      cfg.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
    end
  end
  # ---------------------------------------------------------------`;

      if (podfileContent.match(/post_install do \|installer\|/)) {
        // Inject right after the opening line of the existing post_install block
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${fixSnippet}`
        );
      } else {
        // Fallback: no post_install block found — append one
        podfileContent += `\npost_install do |installer|${fixSnippet}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
};

module.exports = withConcurrencyFix;
