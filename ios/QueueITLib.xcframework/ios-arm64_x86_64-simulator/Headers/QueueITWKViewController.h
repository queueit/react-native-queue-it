#import <WebKit/WebKit.h>

@protocol QueueITViewControllerDelegate;

@interface QueueITWKViewController : UIViewController

@property (nonatomic, weak)id<QueueITViewControllerDelegate> _Nullable delegate;

-(instancetype _Nullable )initWithHost:(nonnull UIViewController *)host
                              queueUrl:(nonnull NSString*)queueUrl
                        eventTargetUrl:(nonnull NSString*)eventTargetUrl
                            customerId:(nonnull NSString*)customerId
                               eventId:(nonnull NSString*)eventId;

- (void) close:(void (^ __nullable)(void))completion;
- (BOOL) handleSpecialUrls:(nonnull NSURL*) url
           decisionHandler:(nonnull void (^)(WKNavigationActionPolicy))decisionHandler;
- (BOOL) isTargetUrl:(nonnull NSURL*) targetUrl
      destinationUrl:(nonnull NSURL*) destinationUrl;
- (BOOL) isBlockedUrl:(nonnull NSURL*) destinationUrl;

@end

@protocol QueueITViewControllerDelegate <NSObject>
-(void)notifyViewControllerClosed;
-(void)notifyViewControllerUserExited;
-(void)notifyViewControllerSessionRestart;
-(void)notifyViewControllerQueuePassed:(NSString* _Nullable) queueToken;
-(void)notifyViewControllerPageUrlChanged:(NSString* _Nullable) urlString;
-(void)notifyViewControllerError:(NSError* _Nonnull) error;
@end
