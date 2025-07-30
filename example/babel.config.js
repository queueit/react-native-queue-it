const path = require('path');
const pak = require('../package.json');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          'react-native-queue-it': path.resolve(
            __dirname,
            '..',
            //'react-native-queue-it',
            'src',
            'index'
          ),
        },
      },
    ],
  ],
};
