package com.reactnativequeueit

import android.os.Handler
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*

class QueueItModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  private val handler = Handler(reactContext.mainLooper)
  private val context = reactContext

  override fun getName(): String {
    return "QueueIt"
  }

  // Example method
  // See https://facebook.github.io/react-native/docs/native-modules-android
  @ReactMethod
  fun multiply(a: Int, b: Int, promise: Promise) {
    promise.resolve(a * b)
  }


  @ReactMethod
  fun enableTesting() {
    QueueService.IsTest = true
  }

  @ReactMethod
  fun run(customerId: String, eventAlias: String, promise: Promise) {

    val qListener = object: QueueListener{
      override fun onQueuePassed(queuePassedInfo: QueuePassedInfo?) {
        handler.post(Runnable {
          promise.resolve(queuePassedInfo?.queueItToken)
        })
      }

      override fun onQueueItUnavailable() {
        handler.post(Runnable {
          promise.reject("unavailable", "unavailable")
        })
      }

      override fun onQueueViewWillOpen() {
        val params = Arguments.createMap()
        sendEvent(context, "openingQueueView", params)
      }

      override fun onQueueDisabled() {
        handler.post(Runnable {
          promise.reject("disabled", "disabled")
        })
      }

      override fun onError(error: Error?, errorMessage: String?) {
        handler.post(Runnable {
          promise.reject("error", errorMessage)
        })
      }
    }

    handler.post(Runnable {
      val queueEngine = QueueITEngine(context, customerId, eventAlias, qListener)
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
