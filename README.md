[![NPM](https://nodei.co/npm/react-native-queue-it.png)](https://www.npmjs.com/package/react-native-queue-it)

# react-native-queue-it

React Native Module for integrating Queue-it's virtual waiting room into React Native apps.

## Sample app
A sample app project to try out functionality in the library can be found in the [example](https://github.com/queueit/react-native-queue-it/tree/master/example) directory.

## Installation
Before starting please download the whitepaper **Mobile App Integration** from the Go Queue-it Platform. This whitepaper contains the needed information to perform a successful integration.

Using npm you can install the module:
``` sh
npm install --save react-native-queue-it
#On iOS
cd ios && pod install
```

When Android is used, the following activity also needs to be included in the application's manifest file.

``` xml
<activity android:name="com.queue_it.androidsdk.QueueActivity"/>
```

## Usage
To protect parts of your application you'll need to make a `QueueIt.run` call and await it's result.
Once the async call completes, the user has gone through the queue and you get a **QueueITToken** for this session.

``` js
import { QueueIt, EnqueueResultState } from 'react-native-queue-it';

// ...

//This function would make the user enter a queue and it would await for his turn to come.
//It returns a QueueITToken that signifies the user's session.
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
      QueueIt.once('userExited', () => {
        console.log('user exited the line');
      });
      //Optional layout name that should be used for the waiting room page
      const layoutName = "";
      //Optional language for the waiting room page
      const language = "";
      const enqueueResult = await QueueIt.run(
        this.state.customerId,
        this.state.eventOrAliasId,
        layoutName,
        language
      );
      switch (enqueueResult.State) {
        case EnqueueResultState.Disabled:
          console.log('queue is disabled');
          break;
        case EnqueueResultState.Passed:
          console.log(`user got his turn, with QueueITToken: ${enqueueResult.QueueITToken}`);
          break;
        case EnqueueResultState.Unavailable:
          console.log('queue is unavailable');
          break;
      }
      return enqueueResult.QueueITToken;
    } catch (e) {
      console.log(`error: ${e}`);
    }
};
```
As the App developer you must manage the state (whether user was previously queued up or not) inside your app's storage. After you have awaited the `run` call, the app must remember this, possibly with a date/time expiration. When the user goes to another page/screen - you check his state, and only call `run` in the case where the user was not previously queued up. When the user clicks back, the same check needs to be done.

![App Integration Flow](https://github.com/queueit/react-native-queue-it/blob/master/App%20integration%20flow.PNG "App Integration Flow")


### Events

You can receive events from this library by subscribing to it:
```js
QueueIt.once('openingQueueView', ()=> console.log('opening queue page..'));
//Or
const listener = QueueIt.on('openingQueueView', ()=> console.log('opening queue page..'));
// ...
listener.remove();
```

Right now these are the events that are emitted:

* `openingQueueView` - Happens whenever the queue screen is going to be shown.
* `userExited` - Happens whenever the user exists the line. Note that he may return back to it if he desires.

## License

MIT
