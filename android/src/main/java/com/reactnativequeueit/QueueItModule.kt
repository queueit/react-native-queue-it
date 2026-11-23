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

    fun rejectWithError(promise: Promise, error: Error?, errorMessage: String?) {
      val sdkCode = error?.name
      val errorCode = if (sdkCode == "Queueit_NotAvailable") "QUEUEIT_UNAVAILABLE" else sdkCode
      if (errorCode == null) {
        promise.reject("error", errorMessage)
        return
      }
      val userInfo = Arguments.createMap()
      userInfo.putString("errorCode", errorCode)
      promise.reject("error", errorMessage, userInfo)
    }
  }

  public val handler = Handler(reactContext.mainLooper)
  public val context = reactContext

  fun getName(): String {
    return NAME
  }

  fun runAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, queueListener, QueueItEngineOptions.getDefault())
        if (!inviteCode.isNullOrEmpty()) {
          queueEngine.setInviteCode(inviteCode)
        }
        queueEngine.run(activity)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, queueListener, QueueItEngineOptions.getDefault())
        if (!inviteCode.isNullOrEmpty()) {
          queueEngine.setInviteCode(inviteCode)
        }
        queueEngine.runWithEnqueueToken(activity, enqueueToken)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun runWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val queueEngine = QueueITEngine(activity, customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, queueListener, QueueItEngineOptions.getDefault())
        if (!inviteCode.isNullOrEmpty()) {
          queueEngine.setInviteCode(inviteCode)
        }
        queueEngine.runWithEnqueueKey(activity, enqueueKey)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  fun tryPassAsync(customerId: String, eventAlias: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    checkPass(customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise) { it.tryPass() }
  }

  fun tryPassWithEnqueueTokenAsync(customerId: String, eventAlias: String, enqueueToken: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    checkPass(customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise) { it.tryPassWithEnqueueToken(enqueueToken) }
  }

  fun tryPassWithEnqueueKeyAsync(customerId: String, eventAlias: String, enqueueKey: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise) {
    checkPass(customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, inviteCode, promise) { it.tryPassWithEnqueueKey(enqueueKey) }
  }

  fun showQueueAsync(customerId: String, eventAlias: String, queueUrl: String, targetUrl: String, queueItToken: String, urlTTLInMinutes: Double, waitingRoomDomain: String?, queuePathPrefix: String?, queueListener: QueueListener, promise: Promise) {
    handler.post {
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("error", "Calling QueueItRun with a null activity/context")
        return@post
      }
      try {
        val options = QueueItEngineOptions.getDefault()
        UserAgentManager.initialize(activity, options.sdkUserAgent)
        val waitingRoomView = QueueITWaitingRoomView(activity, queueListener, options, waitingRoomDomain, queuePathPrefix)
        val queueTryPassResult = QueueTryPassResult(queueItToken, queueUrl, targetUrl, urlTTLInMinutes.toInt(), false, RedirectType.queue)
        waitingRoomView.showQueue(queueTryPassResult, UserAgentManager.getUserAgent())
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  private fun checkPass(customerId: String, eventAlias: String, layoutName: String?, language: String?, waitingRoomDomain: String?, queuePathPrefix: String?, inviteCode: String?, promise: Promise, check: (QueueITWaitingRoomProvider) -> Unit) {
    handler.post {
      val providerContext = context.currentActivity ?: context.applicationContext
      try {
        val provider = QueueITWaitingRoomProvider(providerContext, customerId, eventAlias, layoutName, language, waitingRoomDomain, queuePathPrefix, null, getProviderListener(promise))
        if (!inviteCode.isNullOrEmpty()) {
          provider.setInviteCode(inviteCode)
        }
        check(provider)
      } catch (e: Exception) {
        promise.reject("error", e.message)
        return@post
      }
    }
  }

  private fun getProviderListener(promise: Promise): QueueITWaitingRoomProviderListener {
    return object : QueueITWaitingRoomProviderListener {
      override fun onSuccess(result: QueueTryPassResult?) {
        handler.post {
          val params = Arguments.createMap()
          params.putString("queueittoken", result?.queueItToken ?: "")
          params.putString("queueUrl", result?.queueUrl ?: "")
          params.putString("targetUrl", result?.targetUrl ?: "")
          params.putInt("urlTTLInMinutes", result?.urlTTLInMinutes ?: 0)
          params.putString("redirectType", result?.redirectType?.name ?: RedirectType.unknown.name)
          promise.resolve(params)
        }
      }

      override fun onFailure(message: String?, error: Error?) {
        handler.post {
          if (error == Error.Queueit_NotAvailable) {
            val params = Arguments.createMap()
            params.putString("queueittoken", "")
            params.putString("state", EnqueueResultState.Unavailable.name)
            promise.resolve(params)
          } else {
            rejectWithError(promise, error, message)
          }
        }
      }
    }
  }
}
