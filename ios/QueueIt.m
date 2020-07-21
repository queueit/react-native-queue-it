#import "QueueIt.h"

@implementation QueueIt

RCT_EXPORT_MODULE()

// Example method
// See // https://facebook.github.io/react-native/docs/native-modules-ios
RCT_REMAP_METHOD(multiply,
                 multiplyWithA:(nonnull NSNumber*)a withB:(nonnull NSNumber*)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  NSNumber *result = @([a floatValue] * [b floatValue]);

  resolve(result);
}

RCT_REMAP_METHOD(enableTesting, enableTesting)
{
    NSLog(@"enabled testing");
}

RCT_REMAP_METHOD(runAsync,
                 runAsync:(nonnull NSString*) clientId eventOrAliasId:(nonnull NSString*)eventOrAliasId){
    NSLog(@"Running");
}

@end
