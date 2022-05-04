#import <Foundation/Foundation.h>
#import "RNQueueitWebview.h"
#import "RNQueueitWebviewManager.h"

#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"


@interface RNQueueitWebview()
@property (nonatomic, strong) QueueITWKViewController *currentWebView;
- (void) setWebview:(QueueITWKViewController*)webview;
@end


@implementation QueueITEngine(Component)

-(void)showQueue:(NSString*)queueUrl targetUrl:(NSString*)targetUrl
{
    QueueITWKViewController *queueWKVC = [[QueueITWKViewController alloc] initWithHost:nil
                                                                           queueEngine:self
                                                                              queueUrl:queueUrl
                                                                        eventTargetUrl:targetUrl
                                                                            customerId:self.customerId
                                                                               eventId:self.eventId];
    RNQueueitWebview* view = [QueueitWebviewsManager getView:self.customerId waitingRoomId:self.eventId];
    [view setWebview: queueWKVC];
}

@end


static NSMutableDictionary *data = [NSMutableDictionary dictionary];

@implementation QueueitWebviewsManager : NSObject


+(RNQueueitWebview*) getView:(NSString*)customerId
                      waitingRoomId:(NSString*)waitingRoomId
{
    return [data objectForKey:customerId];
}

+(void) setView:(NSString*) customerId
    waitingRoomId:(NSString*) waitingRoomId
    view:(RNQueueitWebview*)view
{
    [data setObject:view forKey:customerId];
}

@end

@implementation RNQueueitWebview : UIView
    RCTEventDispatcher *_eventDispatcher;


- (void)setCustomerId:(NSString *)customerId
{
  if (![customerId isEqual:_customerId]) {
    _customerId = [customerId copy];
  }
}

- (void)setWaitingRoomId:(NSString *)waitingRoomId
{
    if (![waitingRoomId isEqual:_waitingRoomId]) {
        _waitingRoomId = [waitingRoomId copy];
    }
}

-(void)setLanguage:(NSString *)language
{
    if (![language isEqual:_language]) {
        _language = [language copy];
    }
}

-(void)setLayoutName:(NSString *)layoutName
{
    if (![layoutName isEqual:_layoutName]) {
        _layoutName = [layoutName copy];
    }
}

-(void) initializeEngine:(UIViewController*) vc
              customerId:(nonnull NSString*) customerId
          eventOrAliasId:(nonnull NSString*) eventOrAliasId
              layoutName:(NSString*) layoutName
                language: (NSString*) language
{
    self.engine = [[QueueITEngine alloc]initWithHost:vc customerId:customerId eventOrAliasId:eventOrAliasId layoutName:layoutName language:language];
    //[self.engine setViewDelay:5]; // Optional delay parameter you can specify (in case you want to inject some animation before Queue-It UIWebView or WKWebView will appear
    self.engine.queuePassedDelegate = self; // Invoked once the user is passed the queue
    self.engine.queueViewWillOpenDelegate = self; // Invoked to notify that Queue-It UIWebView or WKWebview will open
    self.engine.queueDisabledDelegate = self; // Invoked to notify that queue is disabled
    self.engine.queueITUnavailableDelegate = self; // Invoked in case QueueIT is unavailable (500 errors)
    self.engine.queueUserExitedDelegate = self; // Invoked when user chooses to leave the queue
    self.engine.queueViewClosedDelegate = self; // Invoked after the WebView is closed
    self.engine.queueSessionRestartDelegate = self; // Invoked after user clicks on a link to restart the session. The link is 'queueit://restartSession'.
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super init])) {
    _eventDispatcher = eventDispatcher;
  }
    super.backgroundColor = [UIColor clearColor];

    return self;
}

- (void) close {
    [self.currentWebView removeFromParentViewController];
    [self.currentWebView.view removeFromSuperview];
    [self removeFromSuperview];
}

- (void) setWebview:(QueueITWKViewController*)webview
{
    self.currentWebView = webview;
    self.currentWebView.view.frame = self.bounds;
    [self addSubview:self.currentWebView.view];
}

- (void)layoutSubviews
{
    UIViewController* vc = RCTPresentedViewController();
    [self initializeEngine:vc customerId:self.customerId eventOrAliasId:self.waitingRoomId layoutName:self.layoutName language:self.language];
    
    NSError* error = nil;
    [QueueitWebviewsManager setView:self.customerId waitingRoomId:self.waitingRoomId view:self];
    BOOL ok = [self.engine run: &error];
    if(!ok){
        if(error && [error code] == NetworkUnavailable){
            if(_onStatusChanged){
                _onStatusChanged(@{ @"QueueITToken": @"", @"State": ENQUEUE_STATE(Unavailable) });
            }
        }
        else if([error code] == RequestAlreadyInProgress){
            // Thrown when request to Queue-It has already been made and currently in progress. You can ignore this.
        }else{
            // Unknown error
        }
    }
}

// This callback will be called when the user has been through the queue.
// Here you should store session information, so user will only be sent to queue again if the session has timed out.
-(void) notifyYourTurn:(QueuePassedInfo*) queuePassedInfo {
    if(_onStatusChanged){
        NSString *queueItToken = queuePassedInfo.queueitToken;
        if(queueItToken==nil){
                queueItToken = @"";
        }
        _onStatusChanged(@{ @"QueueITToken": queueItToken, @"State": ENQUEUE_STATE(Passed) });
    }
    [self close];
}

// This callback will be called just before the webview (hosting the queue page) will be shown.
// Here you can change some relevant UI elements.
-(void) notifyQueueViewWillOpen {
    NSLog(@"Queue will open");
}

// This callback will be called when the queue used (event alias ID) is in the 'disabled' state.
// Most likely the application should still function, but the queue's 'disabled' state can be changed at any time,
// so session handling is important.
-(void)notifyQueueDisabled:(QueueDisabledInfo* _Nullable) queueDisabledInfo {
    if(_onStatusChanged){
        NSString *queueItToken = queueDisabledInfo.queueitToken;
        if(queueItToken==nil){
                queueItToken = @"";
        }
        _onStatusChanged(@{ @"QueueITToken": queueItToken, @"State": ENQUEUE_STATE(Disabled) });
    }
    [self close];
}

// This callback will be called when the mobile application can't reach Queue-it's servers.
// Most likely because the mobile device has no internet connection.
// Here you decide if the application should function or not now that is has no queue-it protection.
-(void) notifyQueueITUnavailable:(NSString*) errorMessage {
    if(_onStatusChanged){
        _onStatusChanged(@{ @"QueueITToken": @"", @"State": ENQUEUE_STATE(Unavailable) });
    }
    [self close];
}

// This callback will be called after a user clicks a close link in the layout and the WebView closes.
// The close link is "queueit://close". Whenever the user navigates to this link, the SDK intercepts the navigation
// and closes the webview.
-(void)notifyViewClosed {
    NSLog(@"The queue view was closed.");
}

// This callback will be called when the user clicks on a link to restart the session.
// The link is 'queueit://restartSession'. Whenever the user navigates to this link, the SDK intercepts the navigation,
// closes the WebView, clears the URL cache and calls this callback.
// In this callback you would normally call run/runWithToken/runWithKey in order to restart the queueing.
-(void) notifySessionRestart {
    if(_onStatusChanged){
        _onStatusChanged(@{ @"QueueITToken": @"", @"State": ENQUEUE_STATE(RestartedSession) });
    }
    [self close];
}

@end
