# React Native QueueIt Example App on the older architecture

This is a bare React Native 0.81 app with the new architecture turned off on both phones (`newArchEnabled=false` in `android/gradle.properties`, and `RCT_NEW_ARCH_ENABLED` set to `0` in `ios/Podfile`).
It shows the same screen as `exampleApp`, and is used to check each release of `react-native-queue-it` on the older setup.

## Requirements

The same as for `exampleApp`: Node.js 20 or newer, Android Studio with an emulator or a device, Xcode for iOS, and JDK 17 or newer.

## Getting Started - Android app

Follow these steps from the project root (./app-sdk-react-native/):

```bash
npm install
cd exampleOldArchApp
npm install
npx react-native run-android
```

## Getting Started - iOS app

Follow these steps from the project root (./app-sdk-react-native/):

```bash
npm install
cd exampleOldArchApp
npm install
cd ./ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios
```

## Checking the packed package

To check the package that is about to be published:

1. Run `npm pack` in the project root.
2. In this app, run `npm install` first, then `npm install --no-save <path to the .tgz>`. Running `npm install` after this puts the `file:../` link back, so the check would test the source tree instead.
3. On iOS, run `bundle exec pod install` in `ios` again after swapping the package.
4. Start the app with `npx react-native run-android` or `npx react-native run-ios`.

Do not commit that change: `package.json` keeps `file:../`.
