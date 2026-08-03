#import "QueueITWKViewController.h"
#import "QueueDisabledInfo.h"
#import "QueuePassedInfo.h"

@protocol QueueITWaitingRoomViewDelegate;

@interface QueueITWaitingRoomView : NSObject<QueueITViewControllerDelegate>

@property (nonatomic, weak)id<QueueITWaitingRoomViewDelegate> _Nullable delegate;

-(instancetype _Nonnull)initWithHost:(UIViewController* _Nonnull)host
                        customerId: (NSString* _Nonnull)customerId
                        eventId: (NSString* _Nonnull)eventId;

-(void)show:(NSString* _Nonnull)queueUrl targetUrl:(NSString* _Nonnull)targetUrl;
-(void)setViewDelay:(int)delayInterval;
-(void)close:(void (^ __nullable)(void))onComplete;

@end

@protocol QueueITWaitingRoomViewDelegate <NSObject>
-(void) notifyViewUserExited:(nonnull QueueITWaitingRoomView*)view;
-(void) notifyViewUserClosed:(nonnull QueueITWaitingRoomView*)view;
-(void) notifyViewSessionRestart:(nonnull QueueITWaitingRoomView*)view;
-(void) waitingRoomView:(nonnull QueueITWaitingRoomView*)view notifyViewPassedQueue:(QueuePassedInfo* _Nullable)queuePassedInfo;
-(void) notifyViewQueueDidAppear:(nonnull QueueITWaitingRoomView*)view;
-(void) notifyViewQueueWillOpen:(nonnull QueueITWaitingRoomView*)view;
-(void) waitingRoomView:(nonnull QueueITWaitingRoomView*)view notifyViewUpdatePageUrl:(NSString* _Nullable) urlString;
-(void) waitingRoomView:(nonnull QueueITWaitingRoomView*)view notifyViewError:(NSError* _Nonnull)error;
@end
