#import <Foundation/Foundation.h>

@interface QueueCache : NSObject

+ (QueueCache *)instance:(NSString *)customerId eventId:(NSString*)eventId;
-(BOOL)isEmpty;
-(NSString*) getUrlTtl;
-(NSString*) getQueueUrl;
-(NSString*) getTargetUrl;
-(void)update:(NSString*)queueUrl urlTTL:(NSString*)urlTtlString targetUrl:(NSString*)targetUrl;
-(void)clear;

@end
