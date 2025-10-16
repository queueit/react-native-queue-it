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
    QueueService.IsTest = value
  }

  fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, queueListener: QueueListener?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, queueListener)
        queueEngine.run(context.currentActivity)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, queueListener: QueueListener?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, queueListener)
        queueEngine.runWithEnqueueToken(context.currentActivity, enqueueToken)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, queueListener: QueueListener?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, queueListener)
        queueEngine.runWithEnqueueKey(context.currentActivity, enqueueKey)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }
}
