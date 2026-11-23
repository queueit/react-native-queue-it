#import "QueueIt.h"

#if __has_include("react_native_queue_it-Swift.h")
#import "react_native_queue_it-Swift.h"
#else
#import <react_native_queue_it/react_native_queue_it-Swift.h>
#endif

@interface QueueIt ()
@property (nonatomic, strong) NativeQueueItSpecBase *specBase;

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSMutableArray<RCTPromiseResolveBlock> *> *waiters;

- (QueueItRunner *)runnerForCustomerId:(nonnull NSString *)customerId
                        eventOrAliasId:(nonnull NSString *)eventOrAliasId
                            layoutName:(NSString * _Nullable)layoutName
                              language:(NSString * _Nullable)language
                     waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                       queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                            inviteCode:(NSString * _Nullable)inviteCode
                               resolve:(RCTPromiseResolveBlock)resolve
                                reject:(RCTPromiseRejectBlock)reject;

- (QueueItPassCheck *)passCheckForCustomerId:(nonnull NSString *)customerId
                              eventOrAliasId:(nonnull NSString *)eventOrAliasId
                                  layoutName:(NSString * _Nullable)layoutName
                                    language:(NSString * _Nullable)language
                           waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                             queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                                  inviteCode:(NSString * _Nullable)inviteCode
                                     resolve:(RCTPromiseResolveBlock)resolve
                                      reject:(RCTPromiseRejectBlock)reject;

- (void)emitEvent:(NSString *)eventName details:(NSDictionary<NSString *, NSString *> * _Nullable)details;

- (void)resolveWaiters:(NSString *)eventName details:(NSDictionary<NSString *, NSString *> * _Nullable)details;
@end

@implementation QueueIt

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    self.specBase = [[NativeQueueItSpecBase alloc] init];
    self.waiters  = [NSMutableDictionary new];
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#pragma mark - Common helpers

static void RejectWithErrorCode(RCTPromiseRejectBlock reject, NSString *code, NSString *message, NSString * _Nullable errorCode)
{
  NSError *error = errorCode
    ? [NSError errorWithDomain:@"QueueIt" code:0 userInfo:@{@"errorCode": errorCode}]
    : nil;
  reject(code, message, error);
}

- (QueueItPassCheck *)passCheckForCustomerId:(nonnull NSString *)customerId
                              eventOrAliasId:(nonnull NSString *)eventOrAliasId
                                  layoutName:(NSString * _Nullable)layoutName
                                    language:(NSString * _Nullable)language
                           waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                             queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                                  inviteCode:(NSString * _Nullable)inviteCode
                                     resolve:(RCTPromiseResolveBlock)resolve
                                      reject:(RCTPromiseRejectBlock)reject
{
  return [[QueueItPassCheck alloc] initWithCustomerId:customerId
                                 waitingRoomOrAliasId:eventOrAliasId
                                           layoutName:layoutName
                                             language:language
                                    waitingRoomDomain:waitingRoomDomain
                                      queuePathPrefix:queuePathPrefix
                                           inviteCode:inviteCode
                                              resolve:^(NSDictionary<NSString *, id> *result) {
                                                resolve(result);
                                              }
                                               reject:^(NSString *code, NSString *message, NSString * _Nullable errorCode) {
                                                 RejectWithErrorCode(reject, code, message, errorCode);
                                               }];
}

- (QueueItRunner *)runnerForCustomerId:(nonnull NSString *)customerId
                        eventOrAliasId:(nonnull NSString *)eventOrAliasId
                            layoutName:(NSString * _Nullable)layoutName
                              language:(NSString * _Nullable)language
                     waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                       queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                            inviteCode:(NSString * _Nullable)inviteCode
                               resolve:(RCTPromiseResolveBlock)resolve
                                reject:(RCTPromiseRejectBlock)reject
{
  __weak QueueIt *weakSelf = self;
  return [[QueueItRunner alloc] initWithCustomerId:customerId
                              waitingRoomOrAliasId:eventOrAliasId
                                        layoutName:layoutName
                                          language:language
                                 waitingRoomDomain:waitingRoomDomain
                                   queuePathPrefix:queuePathPrefix
                                        inviteCode:inviteCode
                                         presenter:^UIViewController * _Nullable {
                                           return RCTPresentedViewController();
                                         }
                                           resolve:^(NSString *state, NSString *token, NSString * _Nullable errorCode) {
                                             NSMutableDictionary *result = [@{@"queueittoken": token, @"state": state} mutableCopy];
                                             if (errorCode) { result[@"errorCode"] = errorCode; }
                                             resolve(result);
                                           }
                                            reject:^(NSString *code, NSString *message, NSString * _Nullable errorCode) {
                                              RejectWithErrorCode(reject, code, message, errorCode);
                                            }
                                              emit:^(NSString *eventName, NSDictionary<NSString *, NSString *> * _Nullable details) {
                                                [weakSelf emitEvent:eventName details:details];
                                              }];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"openingQueueView", @"userExited", @"webViewClosed", @"queueUrlChanged" ];
}

- (void)emitEvent:(NSString *)eventName details:(NSDictionary<NSString *, NSString *> * _Nullable)details
{
#ifndef RCT_NEW_ARCH_ENABLED
  [self sendEventWithName:eventName body:details ?: @{}];
#else
  NSMutableDictionary *event = [@{@"name": eventName} mutableCopy];
  if (details) { event[@"details"] = details; }
  [self emitOnWebViewEvent:event];
#endif
  [self resolveWaiters:eventName details:details];
}

- (void)resolveWaiters:(NSString *)eventName details:(NSDictionary<NSString *, NSString *> * _Nullable)details
{
  NSMutableArray<RCTPromiseResolveBlock> *list = self.waiters[eventName];
  if (list.count == 0) return;
  self.waiters[eventName] = nil;
  for (RCTPromiseResolveBlock res in list) {
    if (res) { res(details); }
  }
}

#pragma mark - Public API (old arch) ------------------------------------------

#ifndef RCT_NEW_ARCH_ENABLED

RCT_REMAP_METHOD(runAsync,
                 runAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self runnerForCustomerId:customerId
              eventOrAliasId:eventOrAliasId
                  layoutName:layoutName
                    language:language
           waitingRoomDomain:waitingRoomDomain
             queuePathPrefix:queuePathPrefix
                  inviteCode:inviteCode
                     resolve:resolve
                      reject:reject] run];
}

RCT_REMAP_METHOD(runWithEnqueueTokenAsync,
                 runWithEnqueueTokenAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueToken:(nonnull NSString *)enqueueToken
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self runnerForCustomerId:customerId
              eventOrAliasId:eventOrAliasId
                  layoutName:layoutName
                    language:language
           waitingRoomDomain:waitingRoomDomain
             queuePathPrefix:queuePathPrefix
                  inviteCode:inviteCode
                     resolve:resolve
                      reject:reject] runWithEnqueueToken:enqueueToken];
}

RCT_REMAP_METHOD(runWithEnqueueKeyAsync,
                 runWithEnqueueKeyAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueKey:(nonnull NSString *)enqueueKey
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self runnerForCustomerId:customerId
              eventOrAliasId:eventOrAliasId
                  layoutName:layoutName
                    language:language
           waitingRoomDomain:waitingRoomDomain
             queuePathPrefix:queuePathPrefix
                  inviteCode:inviteCode
                     resolve:resolve
                      reject:reject] runWithEnqueueKey:enqueueKey];
}

RCT_REMAP_METHOD(tryPassAsync,
                 tryPassAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self passCheckForCustomerId:customerId
                 eventOrAliasId:eventOrAliasId
                     layoutName:layoutName
                       language:language
              waitingRoomDomain:waitingRoomDomain
                queuePathPrefix:queuePathPrefix
                     inviteCode:inviteCode
                        resolve:resolve
                         reject:reject] tryPass];
}

RCT_REMAP_METHOD(tryPassWithEnqueueTokenAsync,
                 tryPassWithEnqueueTokenAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueToken:(nonnull NSString *)enqueueToken
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self passCheckForCustomerId:customerId
                 eventOrAliasId:eventOrAliasId
                     layoutName:layoutName
                       language:language
              waitingRoomDomain:waitingRoomDomain
                queuePathPrefix:queuePathPrefix
                     inviteCode:inviteCode
                        resolve:resolve
                         reject:reject] tryPassWithEnqueueToken:enqueueToken];
}

RCT_REMAP_METHOD(tryPassWithEnqueueKeyAsync,
                 tryPassWithEnqueueKeyAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueKey:(nonnull NSString *)enqueueKey
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 inviteCode:(NSString * _Nullable)inviteCode
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self passCheckForCustomerId:customerId
                 eventOrAliasId:eventOrAliasId
                     layoutName:layoutName
                       language:language
              waitingRoomDomain:waitingRoomDomain
                queuePathPrefix:queuePathPrefix
                     inviteCode:inviteCode
                        resolve:resolve
                         reject:reject] tryPassWithEnqueueKey:enqueueKey];
}

RCT_REMAP_METHOD(showQueueAsync,
                 showQueueAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 queueUrl:(nonnull NSString *)queueUrl
                 targetUrl:(nonnull NSString *)targetUrl
                 queueItToken:(nonnull NSString *)queueItToken
                 urlTTLInMinutes:(double)urlTTLInMinutes
                 waitingRoomDomain:(NSString * _Nullable)waitingRoomDomain
                 queuePathPrefix:(NSString * _Nullable)queuePathPrefix
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  [[self runnerForCustomerId:customerId
              eventOrAliasId:eventOrAliasId
                  layoutName:nil
                    language:nil
           waitingRoomDomain:waitingRoomDomain
             queuePathPrefix:queuePathPrefix
                  inviteCode:nil
                     resolve:resolve
                      reject:reject] showQueueWithQueueUrl:queueUrl
                                                 targetUrl:targetUrl
                                              queueItToken:queueItToken
                                           urlTTLInMinutes:(NSInteger)urlTTLInMinutes];
}

RCT_REMAP_METHOD(onceAsync,
                 onceAsync:(nonnull NSString *)eventName
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  if (eventName.length == 0) {
    reject(@"error", @"eventName is empty", nil);
    return;
  }
  NSMutableArray *list = self.waiters[eventName];
  if (!list) {
    list = [NSMutableArray new];
    self.waiters[eventName] = list;
  }
  [list addObject:[resolve copy]];
}

#endif // !RCT_NEW_ARCH_ENABLED

#pragma mark - Public API (new arch / codegen) ---------------------------------

#ifdef RCT_NEW_ARCH_ENABLED

- (void)runAsync:(nonnull NSString *)clientId
    eventOrAlias:(nonnull NSString *)eventOrAlias
      layoutName:(nonnull NSString *)layoutName
        language:(nonnull NSString *)language
waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
 queuePathPrefix:(nonnull NSString *)queuePathPrefix
      inviteCode:(nonnull NSString *)inviteCode
         resolve:(nonnull RCTPromiseResolveBlock)resolve
          reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self runnerForCustomerId:clientId
              eventOrAliasId:eventOrAlias
                  layoutName:ln
                    language:lg
           waitingRoomDomain:wd
             queuePathPrefix:qp
                  inviteCode:ic
                     resolve:resolve
                      reject:reject] run];
}

- (void)runWithEnqueueKeyAsync:(nonnull NSString *)clientId
                  eventOrAlias:(nonnull NSString *)eventOrAlias
                    enqueueKey:(nonnull NSString *)enqueueKey
                    layoutName:(nonnull NSString *)layoutName
                      language:(nonnull NSString *)language
             waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
               queuePathPrefix:(nonnull NSString *)queuePathPrefix
                    inviteCode:(nonnull NSString *)inviteCode
                       resolve:(nonnull RCTPromiseResolveBlock)resolve
                        reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self runnerForCustomerId:clientId
              eventOrAliasId:eventOrAlias
                  layoutName:ln
                    language:lg
           waitingRoomDomain:wd
             queuePathPrefix:qp
                  inviteCode:ic
                     resolve:resolve
                      reject:reject] runWithEnqueueKey:enqueueKey];
}

- (void)runWithEnqueueTokenAsync:(nonnull NSString *)clientId
                    eventOrAlias:(nonnull NSString *)eventOrAlias
                    enqueueToken:(nonnull NSString *)enqueueToken
                      layoutName:(nonnull NSString *)layoutName
                        language:(nonnull NSString *)language
               waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
                 queuePathPrefix:(nonnull NSString *)queuePathPrefix
                      inviteCode:(nonnull NSString *)inviteCode
                         resolve:(nonnull RCTPromiseResolveBlock)resolve
                          reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self runnerForCustomerId:clientId
              eventOrAliasId:eventOrAlias
                  layoutName:ln
                    language:lg
           waitingRoomDomain:wd
             queuePathPrefix:qp
                  inviteCode:ic
                     resolve:resolve
                      reject:reject] runWithEnqueueToken:enqueueToken];
}

- (void)tryPassAsync:(nonnull NSString *)clientId
        eventOrAlias:(nonnull NSString *)eventOrAlias
          layoutName:(nonnull NSString *)layoutName
            language:(nonnull NSString *)language
   waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
     queuePathPrefix:(nonnull NSString *)queuePathPrefix
          inviteCode:(nonnull NSString *)inviteCode
             resolve:(nonnull RCTPromiseResolveBlock)resolve
              reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self passCheckForCustomerId:clientId
                 eventOrAliasId:eventOrAlias
                     layoutName:ln
                       language:lg
              waitingRoomDomain:wd
                queuePathPrefix:qp
                     inviteCode:ic
                        resolve:resolve
                         reject:reject] tryPass];
}

- (void)tryPassWithEnqueueKeyAsync:(nonnull NSString *)clientId
                      eventOrAlias:(nonnull NSString *)eventOrAlias
                        enqueueKey:(nonnull NSString *)enqueueKey
                        layoutName:(nonnull NSString *)layoutName
                          language:(nonnull NSString *)language
                 waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
                   queuePathPrefix:(nonnull NSString *)queuePathPrefix
                        inviteCode:(nonnull NSString *)inviteCode
                           resolve:(nonnull RCTPromiseResolveBlock)resolve
                            reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self passCheckForCustomerId:clientId
                 eventOrAliasId:eventOrAlias
                     layoutName:ln
                       language:lg
              waitingRoomDomain:wd
                queuePathPrefix:qp
                     inviteCode:ic
                        resolve:resolve
                         reject:reject] tryPassWithEnqueueKey:enqueueKey];
}

- (void)tryPassWithEnqueueTokenAsync:(nonnull NSString *)clientId
                        eventOrAlias:(nonnull NSString *)eventOrAlias
                        enqueueToken:(nonnull NSString *)enqueueToken
                          layoutName:(nonnull NSString *)layoutName
                            language:(nonnull NSString *)language
                   waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
                     queuePathPrefix:(nonnull NSString *)queuePathPrefix
                          inviteCode:(nonnull NSString *)inviteCode
                             resolve:(nonnull RCTPromiseResolveBlock)resolve
                              reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);
  NSString *ic = (inviteCode.length        > 0 ? inviteCode        : nil);

  [[self passCheckForCustomerId:clientId
                 eventOrAliasId:eventOrAlias
                     layoutName:ln
                       language:lg
              waitingRoomDomain:wd
                queuePathPrefix:qp
                     inviteCode:ic
                        resolve:resolve
                         reject:reject] tryPassWithEnqueueToken:enqueueToken];
}

- (void)showQueueAsync:(nonnull NSString *)clientId
          eventOrAlias:(nonnull NSString *)eventOrAlias
              queueUrl:(nonnull NSString *)queueUrl
             targetUrl:(nonnull NSString *)targetUrl
          queueItToken:(nonnull NSString *)queueItToken
       urlTTLInMinutes:(double)urlTTLInMinutes
     waitingRoomDomain:(nonnull NSString *)waitingRoomDomain
       queuePathPrefix:(nonnull NSString *)queuePathPrefix
               resolve:(nonnull RCTPromiseResolveBlock)resolve
                reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *wd = (waitingRoomDomain.length > 0 ? waitingRoomDomain : nil);
  NSString *qp = (queuePathPrefix.length   > 0 ? queuePathPrefix   : nil);

  [[self runnerForCustomerId:clientId
              eventOrAliasId:eventOrAlias
                  layoutName:nil
                    language:nil
           waitingRoomDomain:wd
             queuePathPrefix:qp
                  inviteCode:nil
                     resolve:resolve
                      reject:reject] showQueueWithQueueUrl:queueUrl
                                                 targetUrl:targetUrl
                                              queueItToken:queueItToken
                                           urlTTLInMinutes:(NSInteger)urlTTLInMinutes];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeQueueItSpecJSI>(params);
}

- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  [self.specBase setEventEmitterCallback:eventEmitterCallbackWrapper];
}

- (void)emitOnWebViewEvent:(NSDictionary * _Nonnull)value
{
  [self.specBase emitOnWebViewEvent:value];
}

#endif // RCT_NEW_ARCH_ENABLED

@end
