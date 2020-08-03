#import <Foundation/Foundation.h>
#import "QueueService.h"

@protocol QueueService_NSURLConnectionRequestDelegate;

@interface QueueService_NSURLConnectionRequest : NSObject<NSURLConnectionDelegate, NSURLConnectionDataDelegate>

- (NSString *)uniqueIdentifier;

- (instancetype)initWithRequest:(NSURLRequest *)request
             expectedStatusCode:(NSInteger)statusCode
                        success:(QueueServiceSuccess)success
                        failure:(QueueServiceFailure)failure
                       delegate:(id<QueueService_NSURLConnectionRequestDelegate>)delegate;

@end

@protocol QueueService_NSURLConnectionRequestDelegate <NSObject>
- (void)requestDidComplete:(QueueService_NSURLConnectionRequest *)request;
@end
