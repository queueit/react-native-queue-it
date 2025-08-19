# React Native (v0.80.1) 16kb Page Size Update - Configuration
This document describes the required changes in the react-native application to accommodate the new update of react-native-queue-it connector.

## iOS
iOS applications should not be impacted by this update.

## Android
Android apps will need to include the following changes to support the new update.

### gradle/libs.versions.toml
This file contains all the necessary information for the needed dependencies and versions. If this file does not exist, it needs to be created.
```toml
[versions]
# Android versions
minSdk = "24"
targetSdk = "35"
compileSdk = "35"
buildTools = "35.0.0"
ndkVersion = "27.1.12297006"
# Dependencies versions
agp = "8.7.2"
androidx-annotation = "1.6.0"
androidx-appcompat = "1.6.1"
androidx-autofill = "1.1.0"
androidx-swiperefreshlayout = "1.1.0"
androidx-test = "1.5.0"
androidx-tracing = "1.1.0"
assertj = "3.21.0"
binary-compatibility-validator = "0.13.2"
download = "5.4.0"
fbjni = "0.7.0"
fresco = "3.4.0"
infer-annotation = "0.18.0"
javax-annotation-api = "1.3.2"
javax-inject = "1"
jsr305 = "3.0.2"
junit = "4.13.2"
kotlin = "2.0.21"
mockito = "3.12.4"
nexus-publish = "1.3.0"
okhttp = "4.9.2"
okio = "2.9.0"
robolectric = "4.9.2"
soloader = "0.12.1"
xstream = "1.4.20"
yoga-proguard-annotations = "1.19.0"
# Native Dependencies
boost="1_83_0"
doubleconversion="1.1.6"
fastFloat="6.1.4"
fmt="11.0.2"
folly="2024.11.18.00"
glog="0.3.5"
gtest="1.12.1"
react-android="0.80.1"

[libraries]
androidx-appcompat = { module = "androidx.appcompat:appcompat", version.ref = "androidx-appcompat" }
androidx-appcompat-resources = { module = "androidx.appcompat:appcompat-resources", version.ref = "androidx-appcompat" }
androidx-annotation = { module = "androidx.annotation:annotation", version.ref = "androidx-annotation" }
androidx-autofill = { module = "androidx.autofill:autofill", version.ref = "androidx-autofill" }
androidx-swiperefreshlayout = { module = "androidx.swiperefreshlayout:swiperefreshlayout", version.ref = "androidx-swiperefreshlayout" }
androidx-tracing = { module = "androidx.tracing:tracing", version.ref = "androidx-tracing" }
androidx-test-runner = { module = "androidx.test:runner", version.ref = "androidx-test" }
androidx-test-rules = { module = "androidx.test:rules", version.ref = "androidx-test" }

fbjni = { module = "com.facebook.fbjni:fbjni", version.ref = "fbjni" }
folly = { module = "com.facebook.folly:folly", version.ref = "folly" }
fresco = { module = "com.facebook.fresco:fresco", version.ref = "fresco" }
fresco-middleware = { module = "com.facebook.fresco:middleware", version.ref = "fresco" }
fresco-imagepipeline-okhttp3 = { module = "com.facebook.fresco:imagepipeline-okhttp3", version.ref = "fresco" }
fresco-ui-common = { module = "com.facebook.fresco:ui-common", version.ref = "fresco" }
infer-annotation = { module = "com.facebook.infer.annotation:infer-annotation", version.ref = "infer-annotation" }
soloader = { module = "com.facebook.soloader:soloader", version.ref = "soloader" }
yoga-proguard-annotations = { module = "com.facebook.yoga:proguard-annotations", version.ref = "yoga-proguard-annotations" }

jsr305 = { module = "com.google.code.findbugs:jsr305", version.ref = "jsr305" }
okhttp3-urlconnection = { module = "com.squareup.okhttp3:okhttp-urlconnection", version.ref = "okhttp" }
okhttp3 = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
okio = { module = "com.squareup.okio:okio", version.ref = "okio" }
javax-inject = { module = "javax.inject:javax.inject", version.ref = "javax-inject" }
javax-annotation-api = { module = "javax.annotation:javax.annotation-api", version.ref = "javax-annotation-api" }

react-android = { module = "com.facebook.react:react-android", version.ref = "react-android" }
hermes-android = { module = "com.facebook.react:hermes-android", version.ref = "react-android" }

junit = {module = "junit:junit", version.ref = "junit" }
assertj = {module = "org.assertj:assertj-core", version.ref = "assertj" }
mockito = {module = "org.mockito:mockito-inline", version.ref = "mockito" }
robolectric = {module = "org.robolectric:robolectric", version.ref = "robolectric" }
thoughtworks = {module = "com.thoughtworks.xstream:xstream", version.ref = "xstream" }

[plugins]
react = { id = "com.facebook.react", version.ref = "react-android" }
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library" }
download = { id = "de.undercouch.download", version.ref = "download" }
nexus-publish = { id = "io.github.gradle-nexus.publish-plugin", version.ref = "nexus-publish" }
kotlin-android = { id = "org.jetbrains.kotlin.android" }
binary-compatibility-validator = { id = "org.jetbrains.kotlinx.binary-compatibility-validator", version.ref = "binary-compatibility-validator" }
```

### settings.gradle
1. Add the ```dependencyResolutionManagement``` block to reference .toml file;
2. Include ```react-native-queue-it``` directives;
3. Include ```react-native-community_checkbox``` directives (if used by the app);

```gradle
// Example settings.gradle file
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
plugins { id("com.facebook.react.settings") }
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }

// .toml file reference
dependencyResolutionManagement {
  versionCatalogs {
    create("libs") {
      from(files("$rootDir/../gradle/libs.versions.toml"))
    }
  }
}
// .toml file reference

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
1. Add ```android.enableJetifier=true```;
2. Add ```QueueIt_kotlinVersion=1.9.24```;
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
android.enableJetifier=true

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

  implementation(libs.react.android)

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