# React Native QueueIt Example App
This is a sample app used to demonstrate and test the functionality of the `react-native-queue-it` SDK.
It shows how to integrate the Queue-it SDK with React Native, including event handling, async APIs, and proper native module usage.
---
## Requirements
Make sure the following dependencies are installed on your machine:
- [Node.js](https://nodejs.org/) (version 16 or newer recommended)
- [Yarn](https://classic.yarnpkg.com/en/docs/install) or `npm`
- [Android Studio](https://developer.android.com/studio) for Android development
  - Android SDK (API level 34+)
  - Emulator or connected device
  - `adb` properly configured
- [XCode](https://developer.apple.com/xcode/) for iOS development
  - Emulator or connected device
- Java Development Kit (JDK 17 or newer)
---
## Getting Started - Android app
Follow these steps from the project root (./app-sdk-react-native/):
### 1. Install the SDK and dependencies
```bash
npm install
npx react-native codegen
```
### 2. Build and run the example app
```bash
cd ../exampleApp
npm install
npx react-native run-android
```

## Getting Started - iOS app
Follow these steps from the project root (./app-sdk-react-native/):

### 1. Install the SDK and dependencies
```bash
npm install
```

### 2. Build and run the example app
```bash
cd ../exampleApp
npm install
cd ./ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios
```