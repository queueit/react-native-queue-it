# react-native-queue-it

A React Native Queue-It Wrapper

## Installation

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

enqueue = async () => {
    try {
        console.log('going to queue-it');
        const token = await QueueIt.run(this.state.clientId, this.state.event);
        console.log( `got through: ${token}` );
        return token;
    } catch (e) {
        console.log( `error: ${e}` );
    }
};
```

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
