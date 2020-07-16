# react-native-queue-it

React Native Module for integrating Queue-it's virtual waiting room into React Native apps.

## Sample app
A sample app project to try out functionality in the library can be found in the [example](https://github.com/sp0x/react-native-queue-it/tree/master/example) directory.

## Installation
Before starting please download the whitepaper **Mobile App Integration** from the Go Queue-it Platform. This whitepaper contains the needed information to perform a successful integration.

Using npm you can install the module:
``` sh
npm install react-native-queue-it
```

The library also needs network state information so you'll need to include these permissions in your app's manifest file:

``` xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

Once the user gets in a queue, he's shown a different activity `QueueActivity` , so you'll need to include it in your manifest also.

``` xml
<activity android:name="com.queue_it.androidsdk.QueueActivity"/>
```

## Usage

To protect parts of your application you'll need to make a `QueueIt.run` call and await it's result.
Once the async call completes, the user has gone through the queue and you get a **token** for this session.

``` js
import QueueIt from "react-native-queue-it";

// ...

//This function would make the user enter a queue and it would await for his turn to come.
//It returns a token that signifies the user's session.
//An exception would be thrown if:
// the queue is disabled.
// the queue is unavailable.
// there's an error in sending the user to the queue.
enqueue = async () => {
    try {
        console.log('going to queue-it');
        const token = await QueueIt.run(this.state.clientId, this.state.eventIdOrAlias);
        console.log( `got through: ${token}` );
        return token;
    } catch (e) {
        console.log( `error: ${e}` );
    }
};
```
As the App developer you must manage the state (whether user was previously queued up or not) inside your app's storage. After you have awaited the `run` call, the app must remember this, possibly with a date/time expiration. When the user goes to another page/screen - you check his state, and only call `run` in the case where the user was not previously queued up. When the user clicks back, the same check needs to be done.

![App Integration Flow](https://github.com/sp0x/react-native-queue-it/blob/master/App%20integration%20flow.PNG "App Integration Flow")

### Testing 

If you want to use a testing queue, instead of the production one, you just need to call:

``` js
QueueIt.enableTesting();
```
Just make sure you do this, before calling `run`.

### Events

You can subscribe to receive events from the library. Right now these are the events that are emitted:

* `openingQueueView` - Happens whenever the queue screen is going to be shown.

To subscribe for the events, you can place this snippet inside your `onComponentDidMount` method:

``` js
const eventEmitter = new NativeEventEmitter(QueueIt);
this.eventListener = eventEmitter.addListener('openingQueueView', () => {
    console.log('opening queue page..');
});
```

## License

MIT
