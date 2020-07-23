package com.reactnativequeueit

import android.os.Handler
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*


enum class EnqueueResultState {
  Passed, Disabled, Unavailable
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

  @ReactMethod
  fun runAsync(customerId: String, eventAlias: String, promise: Promise) {
    val qListener = object : QueueListener {
      override fun onUserExited() {
        val params = Arguments.createMap()
        sendEvent(context, "userExited", params)
      }

      override fun onQueuePassed(queuePassedInfo: QueuePassedInfo?) {
        handler.post(Runnable {
          val params = Arguments.createMap()
          params.putString("queueittoken", queuePassedInfo?.queueItToken)
          params.putString("state", EnqueueResultState.Passed.name)
          promise.resolve(params)
        })
      }

      override fun onQueueItUnavailable() {
        handler.post(Runnable {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.Unavailable.name)
          promise.resolve(params)
        })
      }

      override fun onQueueViewWillOpen() {
        val params = Arguments.createMap()
        sendEvent(context, "openingQueueView", params)
      }

      override fun onQueueDisabled() {
        handler.post(Runnable {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.Disabled.name)
          promise.resolve(params)
        })
      }

      override fun onError(error: Error?, errorMessage: String?) {
        handler.post(Runnable {
          promise.reject("error", errorMessage)
        })
      }
    }

    handler.post(Runnable {
      val queueEngine = QueueITEngine(context.currentActivity, customerId, eventAlias, qListener)
      queueEngine.run(context.currentActivity)
    })
  }

  private fun sendEvent(reactContext: ReactContext,
                        eventName: String,
                        params: WritableMap) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
