const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const sdkSourcePath = path.resolve(__dirname, '../src');
const rootNodeModules = path.resolve(__dirname, '../node_modules');

const config = {
  projectRoot,
  watchFolders: [sdkSourcePath, rootNodeModules],
  resolver: {
    blockList: exclusionList([/.*\/\.git\/.*/, /.*\/__tests__\/.*/]),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
