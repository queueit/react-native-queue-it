
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Add support for local packages
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../'),
    ],
    // Enable symlinks
    unstable_enableSymlinks: true,
  },
  watchFolders: [
    path.resolve(__dirname, '../'),
  ],
};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);