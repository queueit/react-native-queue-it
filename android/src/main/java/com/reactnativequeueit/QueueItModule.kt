package com.reactnativequeueit

import android.os.Handler
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*

enum class EnqueueResultState {
  Passed, Disabled, Unavailable, RestartedSession
}

class QueueItModule(reactContext: ReactApplicationContext) {

  companion object {
    const val NAME = "QueueIt"
  }

  public val handler = Handler(reactContext.mainLooper)
  public val context = reactContext

  fun getName(): String {
    return NAME
  }

  fun enableTesting(value: Boolean) {
    // No-op: the Queue-it Android SDK no longer has a global test flag. Test environments
    // are now targeted by passing a test `waitingRoomDomain` to QueueITEngine. Kept for
    // cross-platform API compatibility.
  }

  fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        // QueueITEngine args: (context, customerId, eventOrAliasId, layoutName, language,
        // waitingRoomDomain, queuePathPrefix, queueListener, options). The domain/prefix are
        // optional (null = default/production); options uses the SDK defaults.
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, null, null, queueListener, QueueItEngineOptions.getDefault())
        queueEngine.run(activity)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, null, null, queueListener, QueueItEngineOptions.getDefault())
        queueEngine.runWithEnqueueToken(activity, enqueueToken)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, null, null, queueListener, QueueItEngineOptions.getDefault())
        queueEngine.runWithEnqueueKey(activity, enqueueKey)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }
}
