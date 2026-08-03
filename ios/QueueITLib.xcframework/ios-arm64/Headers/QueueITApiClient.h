#import <Foundation/Foundation.h>
#import "QueueStatus.h"

typedef void (^QueueServiceSuccess)(NSData *data);
typedef void (^QueueServiceFailure)(NSError *error, NSString* errorMessage);

@interface QueueITApiClient: NSObject

+ (QueueITApiClient *)getInstance;

-(NSString*)enqueue:(NSString*)customerId
     eventOrAliasId:(NSString*)eventorAliasId
  waitingRoomDomain:(NSString*)waitingRoomDomain
    queuePathPrefix:(NSString*)queuePathPrefix
             userId:(NSString*)userId
          userAgent:(NSString*)userAgent
         sdkVersion:(NSString*)sdkVersion
         layoutName:(NSString*)layoutName
           language:(NSString*)language
       enqueueToken:(NSString*)enqueueToken
         enqueueKey:(NSString*)enqueueKey
            success:(void(^)(QueueStatus* queueStatus))success
            failure:(QueueServiceFailure)failure;

@end
