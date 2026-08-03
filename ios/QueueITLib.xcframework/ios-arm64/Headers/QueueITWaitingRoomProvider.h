#import "QueueITWaitingRoomView.h"
#import "QueueTryPassResult.h"

@protocol QueueITWaitingRoomProviderDelegate;

@interface QueueITWaitingRoomProvider : NSObject

typedef enum {
    NetworkUnavailable = -100,
    RequestAlreadyInProgress = 10
} QueueITRuntimeError;
#define QueueITRuntimeErrorArray @"Network connection is unavailable", @"Enqueue request is already in progress", nil

@property (nonatomic, weak)id<QueueITWaitingRoomProviderDelegate> _Nullable delegate;

-(instancetype _Nonnull)initWithCustomerId:(NSString* _Nonnull)customerId
                            eventOrAliasId:(NSString* _Nonnull)eventOrAliasId
                                layoutName:(NSString* _Nullable)layoutName
                                  language:(NSString* _Nullable)language
                         waitingRoomDomain:(NSString* _Nullable)waitingRoomDomain
                           queuePathPrefix:(NSString* _Nullable)queuePathPrefix;
 
-(BOOL)TryPass: (NSError* _Nullable*_Nullable)error;
-(BOOL)TryPassWithEnqueueToken:(NSString* _Nullable)enqueueToken
                         error:(NSError* _Nullable*_Nullable)error;
-(BOOL)TryPassWithEnqueueKey:(NSString* _Nullable)enqueueKey
                       error:(NSError* _Nullable*_Nullable)error;
-(BOOL)IsRequestInProgress;
@end

@protocol QueueITWaitingRoomProviderDelegate <NSObject>

-(void)waitingRoomProvider:(nonnull QueueITWaitingRoomProvider*)provider notifyProviderSuccess:(QueueTryPassResult* _Nonnull) queuePassResult;
-(void)waitingRoomProvider:(nonnull QueueITWaitingRoomProvider*)provider notifyProviderFailure:(NSString* _Nullable)errorMessage
                   errorCode:(long)errorCode;
@end
