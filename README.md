[![NPM](https://nodei.co/npm/react-native-queue-it.png)](https://www.npmjs.com/package/react-native-queue-it)

# react-native-queue-it

React Native Module for integrating Queue-it's virtual waiting room into React Native apps.

## Sample app

Two sample apps are available to try out the library:

- [`exampleApp`](https://github.com/queueit/react-native-queue-it/tree/master/exampleApp) — bare React Native
- [`example-expo-app`](https://github.com/queueit/react-native-queue-it/tree/master/example-expo-app) — Expo (managed)

## Installation

Before starting please download the whitepaper **Mobile App Integration** from the Go Queue-it Platform. This whitepaper contains the needed information to perform a successful integration.

Using npm you can install the module:

```sh
npm install --save react-native-queue-it
#On iOS
cd ios && pod install
```

On Android, the library automatically registers the required `QueueActivity` — no manual `AndroidManifest.xml` changes are needed.

### Expo

The library works in a managed Expo project with no extra setup. The only exception is `android:allowBackup`: the Queue-it android SDK uses `allowBackup="true"`, so if your app sets `android.allowBackup` to `false` in `app.json` the Android manifest merge fails. To keep `false`, add a config plugin so your app's value wins the merge.

Create `plugins/withQueueItAllowBackup.js`:

```js
const {
  withAndroidManifest,
  createRunOncePlugin,
} = require('expo/config-plugins');

// Makes the app's android:allowBackup value win the manifest merge.
const withQueueItAllowBackup = (config) =>
  withAndroidManifest(config, (config) => {
    const app = config.modResults?.manifest?.application?.[0];
    if (!app) return config;
    app.$ = app.$ || {};
    const existing = app.$['tools:replace'];
    app.$['tools:replace'] = existing
      ? `${existing},android:allowBackup`
      : 'android:allowBackup';
    return config;
  });

const pkg = require('react-native-queue-it/package.json');

module.exports = createRunOncePlugin(
  withQueueItAllowBackup,
  pkg.name,
  pkg.version
);
```

Register it and regenerate the native project:

```json
{ "expo": { "plugins": ["./plugins/withQueueItAllowBackup"] } }
```

```sh
npx expo prebuild --clean
```

> Bare React Native apps can instead add `tools:replace="android:allowBackup"` to the `<application>` element in `android/app/src/main/AndroidManifest.xml`.

## Usage

To protect parts of your application you'll need to make a `QueueIt.run` call and await it's result.
Once the async call completes, the user has gone through the queue and you get a **QueueITToken** for this session.

```tsx
import {
  QueueIt,
  EnqueueResultState,
  EnqueueResult,
} from 'react-native-queue-it';

// ...

//This function would make the user enter a queue and it would await for his turn to come.
//It returns a QueueITToken that signifies the user's session.
//If you have an enqueue key or token you need to use the matching method call.
//An exception would be thrown if:
// 1) Queue-it's servers can't be reached (connectivity issue).
// 2) SSL connection error if custom queue domain is used having an invalid certificate.
// 3) Client receives HTTP 4xx response.
// In all these cases is most likely a misconfiguration of the queue settings:
// Invalid customer ID, event alias ID or cname setting on queue (GO Queue-it portal -> event settings).
enqueue = async () => {
  try {
    console.log('going to queue-it');
    //We wait for the `openingQueueView` event to be emitted once.
    QueueIt.once('openingQueueView', () => {
      console.log('opening queue page..');
    });

    //We wait for the `webViewClosed` event to be emitted when the user click on queueit://close link.
    QueueIt.once('webViewClosed', () => {
      console.log('The queue page is closed by the user.');
    });

    //Optional layout name that should be used for the waiting room page
    const layoutName = null;
    //Optional language for the waiting room page
    const language = null;
    let enqueueResult: EnqueueResult;

    if (this.state.enqueueKey) {
      enqueueResult = await QueueIt.runWithEnqueueKey(
        this.state.clientId,
        this.state.eventOrAlias,
        this.getEnqueueKey()
      );
    } else if (this.state.enqueueToken) {
      enqueueResult = await QueueIt.runWithEnqueueToken(
        this.state.clientId,
        this.state.eventOrAlias,
        this.getEnqueueToken()
      );
    } else {
      enqueueResult = await QueueIt.run(
        this.state.clientId,
        this.state.eventOrAlias
      );
    }
    switch (enqueueResult.State) {
      case EnqueueResultState.Disabled:
        console.log(
          `queue is disabled and QueueITToken is: ${enqueueResult.QueueITToken}`
        );
        break;
      case EnqueueResultState.Passed:
        console.log(
          `user got his turn, with QueueITToken: ${enqueueResult.QueueITToken}`
        );
        break;
      case EnqueueResultState.Unavailable:
        console.log('queue is unavailable');
        break;
      case EnqueueResultState.RestartedSession:
        console.log('user decided to restart the session');
        await this.enqueue();
    }
    return enqueueResult.QueueITToken;
  } catch (e) {
    console.log(`error: ${e}`);
  }
};

getEnqueueToken = () => 'myToken';

getEnqueueKey = () => 'myKey';
```

As the App developer you must manage the state (whether user was previously queued up or not) inside your app's storage. After you have awaited the `run` call, the app must remember this, possibly with a date/time expiration. When the user goes to another page/screen - you check his state, and only call `run` in the case where the user was not previously queued up. When the user clicks back, the same check needs to be done.

![App Integration Flow](https://github.com/queueit/react-native-queue-it/blob/master/App%20integration%20flow.PNG 'App Integration Flow')

### Events

You can receive events from this library by subscribing to it:

```js
QueueIt.once('openingQueueView', () => console.log('opening queue page..'));
//Or
const listener = QueueIt.on('openingQueueView', () =>
  console.log('opening queue page..')
);
// ...
listener.remove();
```

Right now these are the events that are emitted:

- `openingQueueView` - Happens whenever the queue screen is going to be shown.

## License

MIT
