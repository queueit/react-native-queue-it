#import "QueueIt.h"

@interface QueueIt ()
@property (nonatomic, strong)QueueITEngine* engine;
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@end

NSString * const EnqueueResultState_toString[] = {
    [Passed] = @"Passed",
    [Disabled] = @"Disabled",
    [Unavailable] = @"Unavailable"
};

@implementation QueueIt

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(enableTesting,
                 enableTesting:(BOOL)value)
{
    [QueueService setTesting: value];
}

RCT_REMAP_METHOD(runAsync,
                 runAsync:(nonnull NSString*) customerId
                 eventOrAliasId:(nonnull NSString*) eventOrAliasId
                 layoutName:(NSString*) layoutName
                 language: (NSString*) language
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject){

    UIViewController* vc = RCTPresentedViewController();
    self.engine = [[QueueITEngine alloc]initWithHost:vc customerId:customerId eventOrAliasId:eventOrAliasId layoutName:layoutName language:language]; //ARC
    //[self.engine setViewDelay:5]; // Optional delay parameter you can specify (in case you want to inject some animation before Queue-It UIWebView or WKWebView will appear
    self.engine.queuePassedDelegate = self; // Invoked once the user is passed the queue
    self.engine.queueViewWillOpenDelegate = self; // Invoked to notify that Queue-It UIWebView or WKWebview will open
    self.engine.queueDisabledDelegate = self; // Invoked to notify that queue is disabled
    self.engine.queueITUnavailableDelegate = self; // Invoked in case QueueIT is unavailable (500 errors)
    self.engine.queueUserExitedDelegate = self; // Invoked when user chooses to leave the queue
    self.resolve = resolve;
    self.reject = reject;

    NSError* error = nil;
    @try {
        BOOL success = [self.engine run:&error];
        if (!success) {
            if ([error code] == NetworkUnavailable) {
                // Thrown when Queue-It detects no internet connectivity
                NSLog(@"%ld", (long)[error code]);
                NSLog(@"Network unavailable was caught in DetailsViewController");
                NSLog(@"isRequestInProgress - %@", self.engine.isRequestInProgress ? @"YES" : @"NO");
                resolve(@{@"queueittoken": @"", @"state": ENQUEUE_STATE(Unavailable)});
            }
            else if ([error code] == RequestAlreadyInProgress) {
                // Thrown when request to Queue-It has already been made and currently in progress. In general you can ignore this.
            }
            else {
                reject(@"error", @"Unknown error was returned by QueueITEngine", error);
            }
        }
    } @catch (NSException *exception) {
        reject(@"error", @"Unknown unhandled exception by QueueITEngine", error);
    }
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"openingQueueView", @"userExited"];
}

- (void)notifyYourTurn:(QueuePassedInfo *)queuePassedInfo {
    NSString *queueItToken = queuePassedInfo.queueitToken;
    if(queueItToken==nil){
        queueItToken = @"";
    }
    self.resolve(@{@"queueittoken": queueItToken, @"state": ENQUEUE_STATE(Passed)});
}

- (void)notifyQueueViewWillOpen {
    [self sendEventWithName:@"openingQueueView" body:@{}];
}

- (void)notifyQueueDisabled {
    self.resolve(@{@"queueittoken": @"", @"state": ENQUEUE_STATE(Disabled)});
}

- (void)notifyQueueITUnavailable:(NSString *)errorMessage {
    id result = @{@"queueittoken": @"", @"state": ENQUEUE_STATE(Unavailable)};
    self.resolve(result);
}

- (void)notifyUserExited {
    [self sendEventWithName: @"userExited" body:@{}];
}

@end
