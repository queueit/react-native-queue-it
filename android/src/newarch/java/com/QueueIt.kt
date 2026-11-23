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

  fun getQueueListener(promise: Promise): QueueListener {
    return object : QueueListener() {
      override fun onUserExited() {
        sendEvent("userExited")
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
        sendEvent("openingQueueView")
      }

      override fun onQueueUrlChanged(url: String?) {
        val details = Arguments.createMap()
        details.putString("url", url)
        sendEvent("queueUrlChanged", details)
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
          QueueItModule.rejectWithError(promise, error, errorMessage)
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
        sendEvent("webViewClosed")
      }
    }
  }

  @ReactMethod
  override fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.runAsync(customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, getQueueListener(promise), promise)
  }

  @ReactMethod
  override fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.runWithEnqueueTokenAsync(customerId, eventAlias, enqueueToken, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, getQueueListener(promise), promise)
  }

  @ReactMethod
  override fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.runWithEnqueueKeyAsync(customerId, eventAlias, enqueueKey, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, getQueueListener(promise), promise)
  }

  @ReactMethod
  override fun tryPassAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.tryPassAsync(customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise)
  }

  @ReactMethod
  override fun tryPassWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.tryPassWithEnqueueTokenAsync(customerId, eventAlias, enqueueToken, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise)
  }

  @ReactMethod
  override fun tryPassWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    implementation.tryPassWithEnqueueKeyAsync(customerId, eventAlias, enqueueKey, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise)
  }

  @ReactMethod
  override fun showQueueAsync(customerId: String, eventAlias: String, queueUrl: String, targetUrl: String, queueItToken: String, urlTTLInMinutes: Double, waitingRoomDomain: String?, queuePathPrefix: String?, promise: Promise) {
    implementation.showQueueAsync(customerId, eventAlias, queueUrl, targetUrl, queueItToken, urlTTLInMinutes, waitingRoomDomain, queuePathPrefix, getQueueListener(promise), promise)
  }

  @ReactMethod
  fun addListener(eventName: String) { /* no-op */ }
  
  @ReactMethod
  fun removeListeners(count: Double) { /* no-op */ }

  private fun sendEvent(eventName: String, details: WritableMap? = null) {
    val event = Arguments.createMap()
    event.putString("name", eventName)
    if (details != null) {
      event.putMap("details", details)
    }
    emitOnWebViewEvent(event)
  }
}
