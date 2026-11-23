#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <ReactNativeQueueIt/ReactNativeQueueIt.h>

@interface QueueIt : RCTEventEmitter <RCTBridgeModule, NativeQueueItSpec>

@end