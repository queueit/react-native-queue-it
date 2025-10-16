package com.reactnativequeueit

import android.os.Handler
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*

class QueueIt(reactContext: ReactApplicationContext)
  : NativeQueueItSpec(reactContext) {

  private var implementation: QueueItModule = QueueItModule(reactContext)

  override fun getName(): String {
    return implementation.getName()
  }

  @ReactMethod
  override fun enableTesting(value: Boolean) {
    implementation.enableTesting(value)
  }

  fun getQueueListener(promise: Promise): QueueListener {
    return object : QueueListener() {
      override fun onUserExited() {
        val params = Arguments.createMap()
        sendEvent(implementation.context, "userExited", params)
      }

      override fun onQueuePassed(queuePassedInfo: QueuePassedInfo?) {
        implementation.handler.post {
          val params = Arguments.createMap()
          val token = if (queuePassedInfo?.queueItToken != null) queuePassedInfo.queueItToken else ""
          params.putString("queueittoken", token)
          params.putString("state", EnqueueResultState.Passed.name)
          promise.resolve(params)
        }
      }

      override fun onQueueItUnavailable() {
        implementation.handler.post {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.Unavailable.name)
          promise.resolve(params)
        }
      }

      override fun onQueueViewWillOpen() {
        val params = Arguments.createMap()
        sendEvent(implementation.context, "openingQueueView", params)
      }

      override fun onQueueDisabled(queueDisabledInfo: QueueDisabledInfo?) {
        implementation.handler.post {
          val params = Arguments.createMap()
          val token = if (queueDisabledInfo?.queueItToken != null) queueDisabledInfo.queueItToken else ""
          params.putString("queueittoken", token)
          params.putString("state", EnqueueResultState.Disabled.name)
          promise.resolve(params)
        }
      }

      override fun onError(error: Error?, errorMessage: String?) {
        implementation.handler.post {
          promise.reject("error", errorMessage)
        }
      }

      override fun onSessionRestart(queueITEngine: QueueITEngine?) {
        implementation.handler.post {
          val params = Arguments.createMap()
          params.putNull("queueittoken")
          params.putString("state", EnqueueResultState.RestartedSession.name)
          promise.resolve(params)
        }
      }

      override fun onWebViewClosed(){
        val params = Arguments.createMap()
        sendEvent(implementation.context, "webViewClosed", params)
      }
    }
  }

  @ReactMethod
  override fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runAsync(customerId, eventAlias, layoutName, language, getQueueListener(promise), promise)
  }

  @ReactMethod
  override fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runWithEnqueueTokenAsync(customerId, eventAlias, enqueueToken, layoutName, language, getQueueListener(promise), promise)
  }

  @ReactMethod
  override fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runWithEnqueueKeyAsync(customerId, eventAlias, enqueueKey, layoutName, language, getQueueListener(promise), promise)
  }

  @ReactMethod
  fun addListener(eventName: String) { /* no-op */ }
  
  @ReactMethod
  fun removeListeners(count: Double) { /* no-op */ }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap) {
    emitOnWebViewEvent(eventName)
  }
}
