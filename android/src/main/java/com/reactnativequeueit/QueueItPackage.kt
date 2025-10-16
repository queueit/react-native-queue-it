package com.reactnativequeueit

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.TurboReactPackage
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class QueueItPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name == QueueItModule.NAME) {
      return QueueIt(reactContext)
    }
    return null
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList<ViewManager<*, *>>()
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos = mutableMapOf<String, ReactModuleInfo>()
      val isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      moduleInfos[QueueItModule.NAME] = ReactModuleInfo(
        QueueItModule.NAME,
        QueueItModule::class.java.name,
        false,
        false,
        true,
        false,
        isTurboModule
      )
      moduleInfos
    }
  }  
}
