#import <UIKit/UIKit.h>
#import "QueuePassedInfo.h"
#import "QueueDisabledInfo.h"
#import "QueueTryPassResult.h"
#import "QueueConsts.h"
#import "QueueITWaitingRoomView.h"
#import "QueueITWaitingRoomProvider.h"

@protocol QueuePassedDelegate;
@protocol QueueViewWillOpenDelegate;
@protocol QueueDisabledDelegate;
@protocol QueueITUnavailableDelegate;
@protocol QueueUserExitedDelegate;
@protocol QueueITErrorDelegate;
@protocol QueueViewClosedDelegate;
@protocol QueueSessionRestartDelegate;
@protocol QueueUrlChangedDelegate;

@protocol QueueViewDidAppearDelegate;

@interface QueueITEngine : NSObject<QueueITWaitingRoomViewDelegate, QueueITWaitingRoomProviderDelegate>

@property (nonatomic, weak)id<QueuePassedDelegate> _Nullable queuePassedDelegate;
@property (nonatomic, weak)id<QueueViewWillOpenDelegate> _Nullable queueViewWillOpenDelegate;
@property (nonatomic, weak)id<QueueDisabledDelegate> _Nullable queueDisabledDelegate;
@property (nonatomic, weak)id<QueueITUnavailableDelegate> _Nullable queueITUnavailableDelegate;
@property (nonatomic, weak)id<QueueITErrorDelegate> _Nullable queueErrorDelegate;
@property (nonatomic, weak)id<QueueViewClosedDelegate> _Nullable queueViewClosedDelegate;
@property (nonatomic, weak)id<QueueUserExitedDelegate> _Nullable queueUserExitedDelegate;
@property (nonatomic, weak)id<QueueSessionRestartDelegate> _Nullable queueSessionRestartDelegate;
@property (nonatomic, weak)id<QueueUrlChangedDelegate> _Nullable queueUrlChangedDelegate;

@property (nonatomic, weak)id<QueueViewDidAppearDelegate> _Nullable queueViewDidAppearDelegate;

@property (nonatomic, strong)NSString* _Nullable errorMessage;
@property (nonatomic, copy)NSString*  _Nonnull customerId;
@property (nonatomic, copy)NSString*  _Nonnull  eventId;
@property (nonatomic, copy)NSString*  _Nullable  layoutName;
@property (nonatomic, copy)NSString*  _Nullable  language;
@property (nonatomic, copy)NSString* _Nullable waitingRoomDomain;
@property (nonatomic, copy)NSString* _Nullable queuePathPrefix;

-(instancetype _Nonnull )initWithHost:(UIViewController* _Nonnull)host
                           customerId:(NSString* _Nonnull)customerId
                       eventOrAliasId:(NSString* _Nonnull)eventOrAliasId
                           layoutName:(NSString* _Nullable)layoutName
                             language:(NSString* _Nullable)language
                    waitingRoomDomain:(NSString* _Nullable)waitingRoomDomain
                      queuePathPrefix:(NSString* _Nullable)queuePathPrefix;

-(void)setViewDelay:(int)delayInterval;

-(BOOL)run:(NSError* _Nullable* _Nullable)error;
-(BOOL)runWithEnqueueToken:(NSString* _Nonnull) enqueueToken
                     error:(NSError* _Nullable*_Nullable) error;
-(BOOL)runWithEnqueueKey:(NSString* _Nonnull) enqueueKey
                   error:(NSError* _Nullable*_Nullable) error;
-(BOOL)isRequestInProgress;

@end
	
@protocol QueuePassedDelegate <NSObject>
-(void)notifyYourTurn:(QueuePassedInfo* _Nullable) queuePassedInfo;
@end


@protocol QueueViewWillOpenDelegate <NSObject>
-(void)notifyQueueViewWillOpen;
@end

@protocol QueueDisabledDelegate <NSObject>
-(void)notifyQueueDisabled:(QueueDisabledInfo* _Nullable) queueDisabledInfo;
@end

@protocol QueueITUnavailableDelegate <NSObject>
-(void)notifyQueueITUnavailable:(NSString* _Nonnull) errorMessage;
@end

@protocol QueueITErrorDelegate <NSObject>
-(void)notifyQueueError:(NSString* _Nonnull) errorMessage errorCode:(long)errorCode;
@end

@protocol QueueViewClosedDelegate <NSObject>
-(void)notifyViewClosed;
@end

@protocol QueueUserExitedDelegate <NSObject>
-(void)notifyUserExited;
@end

@protocol QueueSessionRestartDelegate <NSObject>
-(void)notifySessionRestart;
@end

@protocol QueueUrlChangedDelegate<NSObject>
-(void)notifyQueueUrlChanged:(NSString* _Nonnull) url;
@end


@protocol QueueViewDidAppearDelegate <NSObject>
-(void)notifyQueueViewDidAppear;
@end
