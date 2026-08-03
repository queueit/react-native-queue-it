#import <Foundation/Foundation.h>
#import "QueueConsts.h"

@interface IOSUtils : NSObject

+(NSString*)getUserId;
+(void)getUserAgent:(void (^)(NSString*))completionHandler;
+(NSString*)getLibraryVersion;
+(NSString*)getSdkVersion;
+(NSString*)convertTtlMinutesToSecondsString:(int)ttlMinutes;
+(NSString*)sanitizeQueuePathPrefix:(NSString*)queuePathPrefix;

@end
