package com.reactnativequeueit

import android.os.Handler
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*


enum class EnqueueResultState {
  Passed, Disabled, Unavailable, RestartedSession
}

class QueueItModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  private val handler = Handler(reactContext.mainLooper)
  private val context = reactContext

  override fun getName(): String {
    return "QueueIt"
  }

  @ReactMethod
  fun enableTesting(value: Boolean) {
    QueueService.IsTest = value
  }

  fun getQueueListener(promise: Promise): QueueListener {
    return object : QueueListener() {
      override fun onUserExited() {
        val params = Arguments.createMap()
        sendEvent(context, "userExited", params)
      }

      override fun onQueuePassed(queuePassedInfo: QueuePassedInfo?) {
        handler.post {
          val params = Arguments.createMap()
          val token = if (queuePassedInfo?.queueItToken != null) queuePassedInfo.queueItToken else ""
          params.putString("queueittoken", token)
          params.putString("state", EnqueueResultState.Passed.name)
          promise.resolve(params)
        }
      }

      override fun onQueueItUnavailable() {
        handler.post {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.Unavailable.name)
          promise.resolve(params)
        }
      }

      override fun onQueueViewWillOpen() {
        val params = Arguments.createMap()
        sendEvent(context, "openingQueueView", params)
      }

      override fun onQueueDisabled(queueDisabledInfo: QueueDisabledInfo?) {
        handler.post {
          val params = Arguments.createMap()
          val token = if (queueDisabledInfo?.queueItToken != null) queueDisabledInfo.queueItToken else ""
          params.putString("queueittoken", token)
          params.putString("state", EnqueueResultState.Disabled.name)
          promise.resolve(params)
        }
      }

      override fun onError(error: Error?, errorMessage: String?) {
        handler.post {
          promise.reject("error", errorMessage)
        }
      }

      override fun onSessionRestart(queueITEngine: QueueITEngine?) {
        handler.post {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.RestartedSession.name)
          promise.resolve(params)
        }
      }

      override fun onWebViewClosed(){
        val params = Arguments.createMap()
        sendEvent(context, "webViewClosed", params)
      }
    }
  }

  @ReactMethod
  fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, getQueueListener(promise))
        queueEngine.run(context.currentActivity)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  @ReactMethod
  fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, getQueueListener(promise))
        queueEngine.runWithEnqueueToken(context.currentActivity, enqueueToken)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  @ReactMethod
  fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, promise: Promise) {
    handler.post {
      if (context.currentActivity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, layoutName, language, getQueueListener(promise))
        queueEngine.runWithEnqueueKey(context.currentActivity, enqueueKey)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  private fun sendEvent(reactContext: ReactContext,
                        eventName: String,
                        params: WritableMap) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
