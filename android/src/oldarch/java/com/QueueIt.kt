package com.reactnativequeueit

import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.queue_it.androidsdk.*
import java.util.concurrent.ConcurrentHashMap

class QueueIt(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  private var implementation: QueueItModule = QueueItModule(reactContext)

  private val waiters = ConcurrentHashMap<String, MutableList<Promise>>()

  override fun getName(): String = implementation.getName()

  @ReactMethod
  fun enableTesting(value: Boolean) {
    implementation.enableTesting(value)
  }

  @ReactMethod
  fun onceAsync(eventName: String, promise: Promise) {
    waiters.compute(eventName) { _, list ->
      val l = list ?: mutableListOf()
      l.add(promise)
      l
    }
  }

  private fun resolveWaiters(eventName: String) {
    val toResolve = waiters.remove(eventName)
    if (toResolve != null) {
      toResolve.forEach { p -> try { p.resolve(null) } catch (_: Throwable) {} }
    } else {
    }
  }

  private fun getQueueListener(promise: Promise): QueueListener {
    return object : QueueListener() {
      override fun onUserExited() {
        implementation.handler.post {
          resolveWaiters("userExited")
        }
      }

      override fun onQueuePassed(queuePassedInfo: QueuePassedInfo?) {
        implementation.handler.post {
          val params = Arguments.createMap()
          val token = queuePassedInfo?.queueItToken ?: ""
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
        implementation.handler.post {
          resolveWaiters("openingQueueView")
        }
      }

      override fun onQueueDisabled(queueDisabledInfo: QueueDisabledInfo?) {
        implementation.handler.post {
          val params = Arguments.createMap()
          val token = queueDisabledInfo?.queueItToken ?: ""
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

      override fun onWebViewClosed() {
        implementation.handler.post {
          resolveWaiters("webViewClosed")
        }
      }
    }
  }

  @ReactMethod
  fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runAsync(customerId, eventAlias, layoutName, language, getQueueListener(promise), promise)
  }

  @ReactMethod
  fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runWithEnqueueTokenAsync(customerId, eventAlias, enqueueToken, layoutName, language, getQueueListener(promise), promise)
  }

  @ReactMethod
  fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, promise: Promise) {
    implementation.runWithEnqueueKeyAsync(customerId, eventAlias, enqueueKey, layoutName, language, getQueueListener(promise), promise)
  }

  // Required to satisfy RN event interface (even when using DeviceEventEmitter)
  @ReactMethod fun addListener(eventName: String) { /* no-op */ }
  @ReactMethod fun removeListeners(count: Double) { /* no-op */ }
}
