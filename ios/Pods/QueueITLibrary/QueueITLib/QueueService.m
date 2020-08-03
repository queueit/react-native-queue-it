#import "QueueService.h"
#import "QueueService_NSURLConnection.h"

static QueueService *SharedInstance;

static NSString * const API_ROOT = @"https://%@.queue-it.net/api/queue";
static NSString * const TESTING_API_ROOT = @"https://%@.test.queue-it.net/api/queue";
static bool testingIsEnabled = NO;

@implementation QueueService

+ (QueueService *)sharedInstance
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        SharedInstance = [[QueueService_NSURLConnection alloc] init];
    });
    
    return SharedInstance;
}

+ (void) setTesting:(bool)enabled
{
    testingIsEnabled = enabled;
}

-(NSString*)enqueue:(NSString *)customerId
     eventOrAliasId:(NSString *)eventorAliasId
             userId:(NSString *)userId
          userAgent:(NSString *)userAgent
         sdkVersion:(NSString*)sdkVersion
         layoutName:(NSString*)layoutName
           language:(NSString*)language
            success:(void (^)(QueueStatus *))success
            failure:(QueueServiceFailure)failure
{
    NSDictionary* bodyDict = nil;
    if (layoutName && language) {
        bodyDict = @{ @"userId": userId, @"userAgent": userAgent, @"sdkVersion":sdkVersion, @"layoutName":layoutName, @"language":language };
    }else if(layoutName && !language) {
        bodyDict = @{ @"userId": userId, @"userAgent": userAgent, @"sdkVersion":sdkVersion, @"layoutName":layoutName };
    }else if(!layoutName && language) {
        bodyDict = @{ @"userId": userId, @"userAgent": userAgent, @"sdkVersion":sdkVersion, @"language":language };
    }else {
        bodyDict = @{ @"userId": userId, @"userAgent": userAgent, @"sdkVersion":sdkVersion };
    }
    
    NSString* urlAsString;
    if(testingIsEnabled){
        urlAsString = [NSString stringWithFormat:TESTING_API_ROOT, customerId];
    }else{
        urlAsString = [NSString stringWithFormat:API_ROOT, customerId];
    }
    urlAsString = [urlAsString stringByAppendingString:[NSString stringWithFormat:@"/%@", customerId]];
    urlAsString = [urlAsString stringByAppendingString:[NSString stringWithFormat:@"/%@", eventorAliasId]];
    urlAsString = [urlAsString stringByAppendingString:[NSString stringWithFormat:@"/appenqueue"]];
    
    return [self submitPUTPath:urlAsString body:bodyDict
            success:^(NSData *data)
            {
                NSError *error = nil;
                NSDictionary *userDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
                if (userDict && [userDict isKindOfClass:[NSDictionary class]])
                {
                    QueueStatus* queueStatus = [[QueueStatus alloc] initWithDictionary:userDict];
                    
                    if (success != NULL) {
                        success(queueStatus);
                    }
                } else if (success != NULL) {
                    success(NULL);
                }
            }
            failure:^(NSError *error, NSString* errorMessage)
            {
                failure(error, errorMessage);
            }];
}

- (NSString *)submitPUTPath:(NSString *)path
                       body:(NSDictionary *)bodyDict
                    success:(QueueServiceSuccess)success
                    failure:(QueueServiceFailure)failure
{
    NSURL *url = [NSURL URLWithString:path];
    return [self submitRequestWithURL:url
                               method:@"PUT"
                                 body:bodyDict
                       expectedStatus:200
                              success:success
                              failure:failure];
}


#pragma mark - Abstract methods
- (NSString *)submitRequestWithURL:(NSURL *)URL
                            method:(NSString *)httpMethod
                              body:(NSDictionary *)bodyDict
                    expectedStatus:(NSInteger)expectedStatus
                           success:(QueueServiceSuccess)success
                           failure:(QueueServiceFailure)failure
{
    return nil;
}


@end
