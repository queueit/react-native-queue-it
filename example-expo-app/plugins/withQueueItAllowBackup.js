/* eslint-env node */

const {
  withAndroidManifest,
  createRunOncePlugin,
} = require('expo/config-plugins');

// NB: Keep this example in sync with the the example in the readme in the repositories root.

// Lets the app's own android:allowBackup value win the manifest merge against
// the Queue-it Android SDK (which declares allowBackup="true"). Only needed if
// your app sets allowBackup to a different value (e.g. false).
const withQueueItAllowBackup = (config) => {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults?.manifest?.application?.[0];
    if (!app) {
      return config;
    }
    app.$ = app.$ || {};
    const existing = app.$['tools:replace'];
    app.$['tools:replace'] = existing
      ? `${existing},android:allowBackup`
      : 'android:allowBackup';
    return config;
  });
};

const pkg = require('react-native-queue-it/package.json');

module.exports = createRunOncePlugin(
  withQueueItAllowBackup,
  pkg.name,
  pkg.version
);
