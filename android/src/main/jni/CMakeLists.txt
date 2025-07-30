cmake_minimum_required(VERSION 3.13)

project(queueit_app)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_ANDROID_STL_TYPE c++_shared)
set(CMAKE_FIND_PACKAGE_PREFER_CONFIG TRUE)

set(REACT_NATIVE_DIR ${PROJECT_SOURCE_DIR}/../../../../node_modules/react-native)
set(REACT_ANDROID_DIR ${REACT_NATIVE_DIR}/ReactAndroid)
set(CODEGEN_DIR ${PROJECT_SOURCE_DIR}/../../../app/build/generated/source/codegen/jni)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

set(SOURCE_FILES
  ${CODEGEN_DIR}/ReactNativeQueueIt-generated.cpp
  ${CODEGEN_DIR}/react/renderer/components/ReactNativeQueueIt/ReactNativeQueueItJSI-generated.cpp
)

include_directories(
    ${CODEGEN_DIR}
    ${PROJECT_SOURCE_DIR}/../../build/generated/source/codegen/jni
    ${PROJECT_SOURCE_DIR}/../cpp/include
    ${REACT_NATIVE_DIR}/ReactCommon
    ${REACT_NATIVE_DIR}/ReactCommon/jsi
    ${REACT_NATIVE_DIR}/ReactCommon/callinvoker
    ${REACT_NATIVE_DIR}/ReactCommon/react/renderer/components/view/platform/android
    ${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/android
    ${REACT_NATIVE_DIR}/ReactCommon/react/nativemodule/core
    ${REACT_NATIVE_DIR}/ReactCommon/react/nativemodule/core/platform/android
    ${REACT_NATIVE_DIR}/ReactCommon/react/utils
    ${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni
)

add_library(queueit_library SHARED ${SOURCE_FILES})
    
find_package(fbjni REQUIRED CONFIG)
target_link_libraries(queueit_library
  fbjni
  jsi
  reactnative
)