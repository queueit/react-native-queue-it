// /*
//  * Copyright (c) Meta Platforms, Inc. and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  */

// #include <DefaultComponentsRegistry.h>
// #include <DefaultTurboModuleManagerDelegate.h>
// #include <autolinking.h>
// #include <fbjni/fbjni.h>
// #include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
// #include <rncore.h>
// #include <NativeQueueItJSI.h>

// namespace facebook::react {

// void registerComponents(
//     std::shared_ptr<const ComponentDescriptorProviderRegistry> registry) {
//   // Custom Fabric Components go here. You can register custom
//   // components coming from your App or from 3rd party libraries here.
//   //
//   // providerRegistry->add(concreteComponentDescriptorProvider<
//   //        MyComponentDescriptor>());

//   // We link app local components if available
// #ifdef REACT_NATIVE_APP_COMPONENT_REGISTRATION
//   REACT_NATIVE_APP_COMPONENT_REGISTRATION(registry);
// #endif

//   // And we fallback to the components autolinked
//   autolinking_registerProviders(registry);
// }

// std::shared_ptr<TurboModule> cxxModuleProvider(
//     const std::string& name,
//     const std::shared_ptr<CallInvoker>& jsInvoker) {
//   // Here you can provide your CXX Turbo Modules coming from
//   // either your application or from external libraries. The approach to follow
//   // is similar to the following (for a module called `NativeCxxModuleExample`):
//   //
//   // if (name == NativeCxxModuleExample::kModuleName) {
//   //   return std::make_shared<NativeCxxModuleExample>(jsInvoker);
//   // }

//   if (name == "QueueIt") {
//     return std::make_shared<NativeQueueItCxxSpecJSI>(jsInvoker);
//   }

//   // And we fallback to the CXX module providers autolinked
//   return autolinking_cxxModuleProvider(name, jsInvoker);
// }

// std::shared_ptr<TurboModule> javaModuleProvider(
//     const std::string& name,
//     const JavaTurboModule::InitParams& params) {
//   // Here you can provide your own module provider for TurboModules coming from
//   // either your application or from external libraries. The approach to follow
//   // is similar to the following (for a library called `samplelibrary`):
//   //
//   // auto module = samplelibrary_ModuleProvider(name, params);
//   // if (module != nullptr) {
//   //    return module;
//   // }
//   // return rncore_ModuleProvider(name, params);

//   // We link app local modules if available
// #ifdef REACT_NATIVE_APP_MODULE_PROVIDER
//   auto module = REACT_NATIVE_APP_MODULE_PROVIDER(name, params);
//   if (module != nullptr) {
//     return module;
//   }
// #endif

//   // We first try to look up core modules
//   if (auto module = rncore_ModuleProvider(name, params)) {
//     return module;
//   }

//   // And we fallback to the module providers autolinked
//   if (auto module = autolinking_ModuleProvider(name, params)) {
//     return module;
//   }

//   return nullptr;
// }

// } // namespace facebook::react

// JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
//   return facebook::jni::initialize(vm, [] {
//     facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
//         &facebook::react::cxxModuleProvider;
//     facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
//         &facebook::react::javaModuleProvider;
//     facebook::react::DefaultComponentsRegistry::
//         registerComponentDescriptorsFromEntryPoint =
//             &facebook::react::registerComponents;
//   });
// }