#import <Foundation/Foundation.h>

@interface QueueTryPassResult : NSObject

@property (nonatomic, strong) NSString* _Nullable queueUrl;
@property (nonatomic, strong) NSString* _Nullable targetUrl;
@property (nonatomic, strong) NSString* _Nonnull redirectType;
@property (nonatomic) BOOL isPassedThrough;
@property (nonatomic) NSString* _Nullable queueToken;


-(instancetype _Nonnull )
    initWithQueueUrl: (NSString* _Nullable) queueUrl
    targetUrl:(NSString* _Nullable)targetUrl
    redirectType: (NSString* _Nonnull) redirectType
    isPassedThrough: (BOOL) isPassedThrough
    queueToken: (NSString* _Nullable) queueToken;

@end
