# Expo example — react-native-queue-it

A sample [Expo](https://expo.dev) (managed) app for trying out [`react-native-queue-it`](../) in an Expo project.

> **A development build is required.** `react-native-queue-it` ships native code, so it cannot run in Expo Go. Use a dev build (`npx expo run:android` / `npx expo run:ios`).

## What's included

- **`app/`** — the example screens, including the enqueue flow that calls `QueueIt.run`.
- **`plugins/withQueueItAllowBackup.js`** — an Expo config plugin that makes the app's `android:allowBackup` value win the AndroidManifest merge against the Queue-it SDK. See the [root README](../README.md#expo) for details.
- **`app.json`** — sets `android.allowBackup: false` and registers the plugin, to demonstrate that setup end to end.

## Run it

```bash
npm install
npx expo run:android   # or: npx expo run:ios
```

After the first native build, `npm start` will open this dev build (not Expo Go).
