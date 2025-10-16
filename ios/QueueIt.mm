#import "QueueIt.h"

@interface QueueIt () <QueuePassedDelegate,
                       QueueViewWillOpenDelegate,
                       QueueDisabledDelegate,
                       QueueITUnavailableDelegate,
                       QueueUserExitedDelegate,
                       QueueViewClosedDelegate,
                       QueueSessionRestartDelegate>
@property (nonatomic, strong) QueueITEngine *engine;
@property (nonatomic, strong) NativeQueueItSpecBase *specBase;

@property (nonatomic, copy) RCTPromiseResolveBlock resolve;
@property (nonatomic, copy) RCTPromiseRejectBlock reject;

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSMutableArray<RCTPromiseResolveBlock> *> *waiters;

- (void)initializeEngine:(UIViewController *)vc
              customerId:(nonnull NSString *)customerId
          eventOrAliasId:(nonnull NSString *)eventOrAliasId
              layoutName:(NSString * _Nullable)layoutName
                language:(NSString * _Nullable)language;

- (void)handleRunResult:(BOOL)success
                  error:(NSError *)error
           withResolver:(RCTPromiseResolveBlock)resolve
           withRejecter:(RCTPromiseRejectBlock)reject;

- (void)resolveWaiters:(NSString *)eventName;
@end

NSString * const EnqueueResultState_toString[] = {
  [Passed] = @"Passed",
  [Disabled] = @"Disabled",
  [Unavailable] = @"Unavailable",
  [RestartedSession] = @"RestartedSession"
};

static inline NSString *EnqueueStateString(EnqueueResultState s) {
  return EnqueueResultState_toString[s];
}

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

- (void)initializeEngine:(UIViewController *)vc
              customerId:(nonnull NSString *)customerId
          eventOrAliasId:(nonnull NSString *)eventOrAliasId
              layoutName:(NSString * _Nullable)layoutName
                language:(NSString * _Nullable)language
{
  self.engine = [[QueueITEngine alloc] initWithHost:vc
                                         customerId:customerId
                                     eventOrAliasId:eventOrAliasId
                                         layoutName:layoutName
                                           language:language];

  self.engine.queuePassedDelegate         = self;
  self.engine.queueViewWillOpenDelegate   = self;
  self.engine.queueDisabledDelegate       = self;
  self.engine.queueITUnavailableDelegate  = self;
  self.engine.queueUserExitedDelegate     = self;
  self.engine.queueViewClosedDelegate     = self;
  self.engine.queueSessionRestartDelegate = self;
}

- (void)handleRunResult:(BOOL)success
                  error:(NSError *)error
           withResolver:(RCTPromiseResolveBlock)resolve
           withRejecter:(RCTPromiseRejectBlock)reject
{
  if (success) return;

  if (error && [error code] == NetworkUnavailable) {
    resolve(@{@"queueittoken": @"", @"state": EnqueueStateString(Unavailable)});
  } else if (error && [error code] == RequestAlreadyInProgress) {
    // ignore
  } else {
    reject(@"error", @"Unknown error was returned by QueueITEngine", error);
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"openingQueueView", @"userExited", @"webViewClosed" ];
}

- (void)resolveWaiters:(NSString *)eventName
{
  NSMutableArray<RCTPromiseResolveBlock> *list = self.waiters[eventName];
  if (list.count == 0) return;
  self.waiters[eventName] = nil;
  for (RCTPromiseResolveBlock res in list) {
    if (res) { res(nil); }
  }
}

#pragma mark - Public API (old arch) ------------------------------------------

#ifndef RCT_NEW_ARCH_ENABLED

RCT_REMAP_METHOD(enableTesting,
                 enableTesting:(BOOL)value)
{
  [QueueService setTesting:value];
}

RCT_REMAP_METHOD(runAsync,
                 runAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:customerId
          eventOrAliasId:eventOrAliasId
              layoutName:layoutName
                language:language];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine run:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
}

RCT_REMAP_METHOD(runWithEnqueueTokenAsync,
                 runWithEnqueueTokenAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueToken:(nonnull NSString *)enqueueToken
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:customerId
          eventOrAliasId:eventOrAliasId
              layoutName:layoutName
                language:language];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine runWithEnqueueToken:enqueueToken error:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
}

RCT_REMAP_METHOD(runWithEnqueueKeyAsync,
                 runWithEnqueueKeyAsync:(nonnull NSString *)customerId
                 eventOrAliasId:(nonnull NSString *)eventOrAliasId
                 enqueueKey:(nonnull NSString *)enqueueKey
                 layoutName:(NSString * _Nullable)layoutName
                 language:(NSString * _Nullable)language
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:customerId
          eventOrAliasId:eventOrAliasId
              layoutName:layoutName
                language:language];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine runWithEnqueueKey:enqueueKey error:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
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

- (void)enableTesting:(BOOL)value
{
  [QueueService setTesting:value];
}

- (void)runAsync:(nonnull NSString *)clientId
    eventOrAlias:(nonnull NSString *)eventOrAlias
      layoutName:(nonnull NSString *)layoutName
        language:(nonnull NSString *)language
         resolve:(nonnull RCTPromiseResolveBlock)resolve
          reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);

  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:clientId
          eventOrAliasId:eventOrAlias
              layoutName:ln
                language:lg];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine run:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
}

- (void)runWithEnqueueKeyAsync:(nonnull NSString *)clientId
                  eventOrAlias:(nonnull NSString *)eventOrAlias
                    enqueueKey:(nonnull NSString *)enqueueKey
                    layoutName:(nonnull NSString *)layoutName
                      language:(nonnull NSString *)language
                       resolve:(nonnull RCTPromiseResolveBlock)resolve
                        reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);

  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:clientId
          eventOrAliasId:eventOrAlias
              layoutName:ln
                language:lg];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine runWithEnqueueKey:enqueueKey error:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
}

- (void)runWithEnqueueTokenAsync:(nonnull NSString *)clientId
                    eventOrAlias:(nonnull NSString *)eventOrAlias
                    enqueueToken:(nonnull NSString *)enqueueToken
                      layoutName:(nonnull NSString *)layoutName
                        language:(nonnull NSString *)language
                         resolve:(nonnull RCTPromiseResolveBlock)resolve
                          reject:(nonnull RCTPromiseRejectBlock)reject
{
  NSString *ln = (layoutName.length > 0 ? layoutName : nil);
  NSString *lg = (language.length   > 0 ? language   : nil);

  UIViewController *vc = RCTPresentedViewController();
  [self initializeEngine:vc
              customerId:clientId
          eventOrAliasId:eventOrAlias
              layoutName:ln
                language:lg];
  self.resolve = resolve;
  self.reject  = reject;

  NSError *error = nil;
  @try {
    BOOL ok = [self.engine runWithEnqueueToken:enqueueToken error:&error];
    [self handleRunResult:ok error:error withResolver:resolve withRejecter:reject];
  } @catch (__unused NSException *ex) {
    reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
  }
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

- (void)emitOnWebViewEvent:(NSString * _Nonnull)value
{
  [self.specBase emitOnWebViewEvent:value];
}

#endif // RCT_NEW_ARCH_ENABLED

#pragma mark - QueueITEngine delegate forwarding --------------------------------

- (void)notifyYourTurn:(QueuePassedInfo *)queuePassedInfo
{
  NSString *token = queuePassedInfo.queueitToken ?: @"";
  if (self.resolve) {
    self.resolve(@{@"queueittoken": token, @"state": EnqueueStateString(Passed)});
  }
}

- (void)notifyQueueViewWillOpen
{
#ifndef RCT_NEW_ARCH_ENABLED
  [self sendEventWithName:@"openingQueueView" body:@{}];
#else
  [self emitOnWebViewEvent:@"openingQueueView"];
#endif
  [self resolveWaiters:@"openingQueueView"];
}

- (void)notifyQueueDisabled:(QueueDisabledInfo *)queueDisabledInfo
{
  NSString *token = queueDisabledInfo.queueitToken ?: @"";
  if (self.resolve) {
    self.resolve(@{@"queueittoken": token, @"state": EnqueueStateString(Disabled)});
  }
}

- (void)notifyQueueITUnavailable:(NSString *)errorMessage
{
  if (self.resolve) {
    self.resolve(@{@"queueittoken": @"", @"state": EnqueueStateString(Unavailable)});
  }
}

- (void)notifyUserExited
{
#ifndef RCT_NEW_ARCH_ENABLED
  [self sendEventWithName:@"userExited" body:@{}];
#else
  [self emitOnWebViewEvent:@"userExited"];
#endif
  [self resolveWaiters:@"userExited"];
}

- (BOOL)notifyNavigation:(NSURL *)url
{
  return NO;
}

- (void)notifyViewClosed
{
#ifndef RCT_NEW_ARCH_ENABLED
  [self sendEventWithName:@"webViewClosed" body:@{}];
#else
  [self emitOnWebViewEvent:@"webViewClosed"];
#endif
  [self resolveWaiters:@"webViewClosed"];
}

- (void)notifySessionRestart
{
  if (self.resolve) {
    self.resolve(@{@"queueittoken": @"", @"state": EnqueueStateString(RestartedSession)});
  }
}

@end
