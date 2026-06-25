# React Native 16kb Page Size Update - Configuration
This document describes the required changes in the react-native application to accommodate the new update of react-native-queue-it connector.

> **Note:** react-native-queue-it now resolves React Native itself through the `com.facebook.react` Gradle plugin, so the app **no longer needs to create a `gradle/libs.versions.toml` version catalog** or register it in `settings.gradle`. It automatically uses the React Native version already installed in your app, so these steps work across React Native versions (verified on 0.83 and 0.86). The instructions below have been simplified accordingly.

## iOS
iOS applications should not be impacted by this update.

## Android
Android apps will need to include the following changes to support the new update.

### settings.gradle
1. Include ```react-native-queue-it``` directives;
2. Include ```react-native-community_checkbox``` directives (if used by the app);

```gradle
// Example settings.gradle file
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
plugins { id("com.facebook.react.settings") }
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }

rootProject.name = 'RNTestSample'
includeBuild('../node_modules/@react-native/gradle-plugin')

// react-native-community_checkbox reference
include ':react-native-community_checkbox'
project(':react-native-community_checkbox').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-community/checkbox/android')
// react-native-community_checkbox reference

// react-native-queue-it reference
include ':react-native-queue-it'
project(':react-native-queue-it').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-queue-it/android')
// react-native-queue-it reference

include ':app'
```

### gradle.properties
1. Add ```QueueIt_kotlinVersion=1.9.24```;
```properties
# Example gradle.properties file
# JVM
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# React Native
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
newArchEnabled=true
hermesEnabled=true

# Android
android.useAndroidX=true

# QueueIt
QueueIt_kotlinVersion=1.9.24
```

### build.gradle
1. Add ```$kotlin_version``` to kotlin classpath;
```gradle
// Example build.gradle file
buildscript {
  def kotlin_version = rootProject.ext.has('kotlinVersion') ? rootProject.ext.get('kotlinVersion') : project.properties['QueueIt_kotlinVersion']
  ext {
      minSdkVersion = 21
      compileSdkVersion = 31
      targetSdkVersion = 31
  }
  repositories {
      mavenCentral()
      google()
  }
  dependencies {
    classpath("com.android.tools.build:gradle")
    classpath("com.facebook.react:react-native-gradle-plugin")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")
  }
}

allprojects {
    repositories {
      mavenCentral()
      google()
      jcenter()
      mavenLocal()
      maven { url("$rootDir/../node_modules/jsc-android/dist") }
      maven { url 'https://www.jitpack.io' }
    }
}
```

### app/build.gradle
1. Add/modify ```plugins``` block;
2. Add ```hermes``` settings:
    1. Add ```project.ext.react``` -> ```enableHermes: true```
    2. Add ```def jscFlavor = 'io.github.react-native-community:jsc-android:2026004.+'```;
    3. Add ```def enableHermes = project.ext.react.get("enableHermes", false);```
3. Enable ```codegenDir``` within ```react``` block;
4. Add ```sourceSets``` block to ```android```;
5. Add ```compileOptions``` block to ```android```;
6. Add ```splits``` block to ```android```;
7. Add ```packagingOptions``` block to ```android```;
8. Add ```buildFeatures``` block to ```android```;
9. Update ```dependencies``` block;
```gradle
// Example app/build.gradle file
plugins {
  id 'com.android.application'
  id 'com.facebook.react'
  id 'kotlin-android'
}

project.ext.react = [
    enableHermes: true,  // clean and rebuild if changing
]
def jscFlavor = 'io.github.react-native-community:jsc-android:2026004.+'
def enableHermes = project.ext.react.get("enableHermes", false);

react {
  codegenDir = file("$buildDir/../../../node_modules/@react-native/codegen")
  autolinkLibrariesWithApp()
}

android {
  namespace "com.rntestsample"
  compileSdkVersion 35

  defaultConfig {
    applicationId "com.rntestsample"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1
    versionName "1.0"
  }

  sourceSets {
    main {
      java.srcDirs = ["${project.projectDir}/src/main/java"]
    }
  }

  buildTypes {
    debug {
      signingConfig signingConfigs.debug
    }
    release {
      signingConfig signingConfigs.debug
      minifyEnabled false
      proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
  }

  signingConfigs {
    debug {
      storeFile file('debug.keystore')
      storePassword 'android'
      keyAlias 'androiddebugkey'
      keyPassword 'android'
    }
  }

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }

  splits {
    abi {
      enable true
      reset()
      universalApk false
      include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
    }
  }

  packagingOptions {
    pickFirst "lib/armeabi-v7a/libc++_shared.so"
    pickFirst "lib/arm64-v8a/libc++_shared.so"
    pickFirst "lib/x86/libc++_shared.so"
    pickFirst "lib/x86_64/libc++_shared.so"
  }

  buildFeatures {
    buildConfig = true
    prefab true
  }
}

dependencies {
  implementation fileTree(dir: "libs", include: ["*.jar"])

  implementation("com.facebook.react:react-android")

  if (enableHermes) {
    implementation("com.facebook.react:hermes-engine:+") {
      exclude group:'com.facebook.fbjni'
    }
  } else {
    implementation jscFlavor
  }

  implementation project(":react-native-queue-it")
}
```

### app/src/main/AndroidManifest.xml
```xml
<!-- Example AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">

  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

  <application
    android:name=".MainApplication"
    android:allowBackup="false"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:usesCleartextTraffic="true"
    tools:replace="android:allowBackup">
    <activity
      android:name=".MainActivity"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
      android:label="@string/app_name"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
    <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
    <activity android:name="com.queue_it.androidsdk.QueueActivity"/>
  </application>

</manifest>
```
