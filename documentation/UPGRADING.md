# Upgrading react-native-queue-it

This page lists, for each release, what you have to change, what behaves differently, what is new, and where Android differs. If your app is on a release before 1.4.0, first read the last section, [Upgrading from a release before 1.4.0](#upgrading-from-a-release-before-140).

## Upgrading to 2.0.0 from 1.4.0

### Changes you have to make

- **iPhone: the library uses Queue-it's Swift SDK.** It is QueueItKit, bundled in the package, in place of the Objective-C QueueITLibrary. Run `pod install` after upgrading. No Podfile change is needed.
- **Both phones: `QueueIt.enableTesting` is removed.** Calling it now throws a `TypeError` when the app runs, and TypeScript reports the member as missing. Instead, pass `waitingRoomDomain: '<customerId>.test.queue-it.net'` in the options of the `tryPass*` or `run*` call. `showQueue` takes it from the pass-check result.

  ```tsx
  import { QueueIt } from 'react-native-queue-it';

  const check = await QueueIt.tryPass(
    'myCustomer',
    'myEvent',
    undefined,
    undefined,
    { waitingRoomDomain: 'myCustomer.test.queue-it.net' }
  );
  ```

  The option applies to one call, while the old switch applied to every later call. On Android the switch already did nothing since 1.3.0, so Android reaches the test environment only through the option. See [Using your own waiting-room domain](../README.md#using-your-own-waiting-room-domain).

- **iPhone: iOS 15 or later is required.** It was iOS 12 in 1.4.0. Raise your app's deployment target to at least 15.
- **Both phones, if your app relied on it: a failed `run*` call no longer removes your event listeners.** In 1.4.0 it removed them all. An app that registers listeners before each attempt must remove them itself, with the subscription's `remove()` or `QueueIt.offAll()`. Otherwise they pile up and fire more than once.
- **Both phones, if your app relied on it: `QueueIt.offAll(eventType)` removes only the listeners of that event type.** In 1.4.0 it removed every listener, whatever it was passed. Call `QueueIt.offAll()` with no argument to remove them all.
- **iPhone, if your app matches on rejection messages: match on `userInfo.errorCode` instead.** Rejections now carry the SDK's own message and `userInfo.errorCode`, instead of "Unknown error was returned by QueueITEngine". See [Errors](../README.md#errors).

### Changes you will notice

- **iPhone: errors that 1.4.0 never passed on now reach the app.** A wrong customer or event id (an HTTP 4xx answer) rejects the call with `userInfo.errorCode` `INVALID_RESPONSE`, where 1.4.0 left the call unsettled. A device id error rejects it with `DEVICE_ID_ERROR`.
- **iPhone: a failure after the waiting room has opened rejects the call.** This covers a page that fails to load and a lost connection. The call now rejects with `userInfo.errorCode`. 1.4.0 did not tell the app.
- **iPhone: with no connection before the waiting room opens, the result now carries an error code.** The call still resolves `Unavailable`, and its result now also carries `ErrorCode` `NO_CONNECTION`.
- **iPhone: a new run replaces an open waiting room.** Starting a new run while a waiting room is open or still starting now closes that room, sends no event for it and leaves the earlier call unsettled. In 1.4.0 the new room opened on top of the earlier one.
- **iPhone: an empty enqueue token or key is rejected.** `runWithEnqueueToken` or `runWithEnqueueKey` with an empty token or key now rejects with `userInfo.errorCode` `INVALID_RESPONSE`, and the message "EnqueueToken cannot be empty" or "EnqueueKey cannot be empty". 1.4.0 sent the empty value to Queue-it.
- **iPhone: the exit link closes the waiting room.** When the visitor uses the page's exit link, the library now closes the waiting room after sending `userExited`. In 1.4.0 the room stayed open.
- **iPhone: a `directLink` pass no longer shows the waiting room in the one-step calls.** `run`, `runWithEnqueueToken` and `runWithEnqueueKey` now resolve `Passed` without showing the waiting room or sending `openingQueueView`. 1.4.0 showed the waiting room. This agrees with the [One-step flow](../README.md#one-step-flow) and with the `directLink` entry under Android below.
- **Android: rejections also carry `userInfo.errorCode`.** The message is unchanged.

### New capabilities

- **Check for a pass, then show the waiting room (both phones).** `QueueIt.tryPass`, `QueueIt.tryPassWithEnqueueKey` and `QueueIt.tryPassWithEnqueueToken` check for a pass without showing anything, and `QueueIt.showQueue` shows the waiting room when the result's `State` is `Queue`. This is now the recommended flow. It adds `QueueItTryPassResult`, `TryPassState` and `RedirectType`. The one-step `run*` calls still work, and the two lists above say what changed in them. See [Usage](../README.md#usage). No change is needed to keep today's behaviour.
- **Invite codes (both phones).** Pass `inviteCode` in the options of `tryPass*` or `run*` to let a visitor into an invite-only waiting room. See [Invite-only waiting rooms](../README.md#invite-only-waiting-rooms). No change is needed to keep today's behaviour.
- **The `queueUrlChanged` event (both phones).** It is sent when the address of the waiting-room page changes, and its listener receives `{ url: string }`. See [Events](../README.md#events). No change is needed to keep today's behaviour.
- **`QueueIt.isEventAvailable` (both phones).** It tells your app whether an event is available on the phone it runs on. See [Events](../README.md#events). No change is needed to keep today's behaviour.
- **Error codes (both phones).** A rejection can carry `userInfo.errorCode`, and `EnqueueResult.ErrorCode` is set when an iPhone has no connection. The iPhone entries above say which errors now reach your app. See [Errors](../README.md#errors).

### Differences on Android

These entries describe how Android differs from iPhone in this release. They are not changes from 1.4.0.

- **`userExited` is not available.** The Android SDK never sends it. `QueueIt.isEventAvailable('userExited')` returns `false` on Android. No change is needed to keep today's behaviour.
- **The pass check rejects with no connection.** On Android, `tryPass*` rejects with `userInfo.errorCode` `NO_CONNECTION`, while on iPhone it resolves `Unavailable`. See [Checking for a pass](../README.md#checking-for-a-pass). No change is needed to keep today's behaviour.
- **A `directLink` pass still shows the waiting room in the one-step calls.** The `run*` calls on Android show the waiting room until a future Android SDK release, while the pass check reports `Passed`. See [One-step flow](../README.md#one-step-flow). No change is needed to keep today's behaviour.

## Upgrading from a release before 1.4.0

Apply every group from the one that matches your app's current release onward, then the 2.0.0 section above. Releases 1.0.x are no longer available. Apps on 0.1.x start at the first group.

### From before 1.1.3

- **Both phones:** `EnqueueResultState.RestartedSession` can be returned, when the visitor follows the page's restart link. Handle it where your app switches on `State`.
- **Both phones:** `QueueIt.runWithEnqueueToken` and `QueueIt.runWithEnqueueKey` are available.
- **Android:** from 1.1.6, a `Disabled` result carries the token in `QueueITToken`, an empty string when there is none, instead of `null`. Apps on 1.1.3 to 1.1.5 read this too.
- **iPhone:** from 1.1.6, a `Disabled` result carries the token in `QueueITToken`, an empty string when there is none, instead of always an empty string. Apps on 1.1.3 to 1.1.5 read this too.

### From before 1.1.7

- **Android:** the minimum SDK was raised. It is now 24, see the group for 1.2.0.
- **Android:** `webViewClosed` is sent from 1.1.7, when the visitor uses the page's close link.
- **iPhone:** `webViewClosed` is sent from 1.1.9, when the visitor uses the page's close link. Apps on 1.1.7 or 1.1.8 read this too.

### From before 1.2.0

- **Both phones:** React Native 0.80.1 or later is required.
- **Android:** the minimum SDK is 24, and AndroidX is required.
- **Android:** the extra Gradle setup that 1.2.0 asked of your app (a version catalog, and entries in `settings.gradle` and `gradle.properties`) is no longer needed from 1.3.0. An app going straight to 2.0.0 skips it.

### From before 1.2.1

- **Both phones:** `QueueIt.on` returns the library's own object with only `remove()`. It no longer returns React Native's `EmitterSubscription`. An app that typed the result as `EmitterSubscription`, or used its other members, changes that.
- **Both phones:** listeners no longer receive the native event body. In 2.0.0 only `queueUrlChanged` listeners receive `{ url }`.

### From before 1.3.0

- **Android:** your app's manifest no longer needs `<activity android:name="com.queue_it.androidsdk.QueueActivity"/>`, since the library registers it.
- **Android:** an app that sets `android:allowBackup="false"` needs the `tools:replace` fix from the [Expo section](../README.md#expo) of the README.
- **Android:** if your app called `QueueIt.enableTesting(true)`, the 2.0.0 entry on the removed switch applies to Android too.

### From before 1.3.1

- **Both phones:** the library no longer brings `react-native`, `@react-native-community/cli` or `@react-native-community/checkbox` with it. An app that used them through the library declares them itself.

### From before 1.4.0

- **iPhone:** nothing beyond the 2.0.0 section above. The iPhone SDK and minimum changes of 1.4.0 are replaced by those of 2.0.0.
