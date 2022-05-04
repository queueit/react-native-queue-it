#import "QueueIt.h"

#import "RCTView.h"
#import "RCTEventDispatcher.h"
#import <React/RCTComponent.h>
#import <React/RCTViewManager.h>
#import <QueueITLibrary/QueueITWKViewController.h>

@interface RNQueueitWebview : UIView < QueuePassedDelegate, QueueViewWillOpenDelegate, QueueDisabledDelegate, QueueITUnavailableDelegate, QueueUserExitedDelegate, QueueViewClosedDelegate, QueueSessionRestartDelegate >

@property (nonatomic, strong)QueueITEngine* _Nonnull engine;
@property (nonatomic, copy)NSString* _Nonnull customerId;
@property (nonatomic, copy)NSString* _Nonnull waitingRoomId;
@property (nonatomic, copy)NSString* _Nullable layoutName;
@property (nonatomic, copy)NSString* _Nullable language;
@property (nonatomic, copy)RCTBubblingEventBlock _Nonnull onStatusChanged;

- (instancetype _Nonnull)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@end

@interface QueueitWebviewsManager : NSObject
+(RNQueueitWebview* _Nonnull) getView:(NSString* _Nonnull)customerId
                      waitingRoomId:(NSString* _Nonnull)waitingRoomId;
+(void) setView:(NSString* _Nonnull)customerId
    waitingRoomId:(NSString* _Nonnull)waitingRoomId
    view:(RNQueueitWebview* _Nonnull)view;
@end

@interface QueueITEngine (Component)

-(void)showQueue:(NSString*)queueUrl targetUrl:(NSString*)targetUrl;

@end
